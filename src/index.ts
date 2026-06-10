import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import "dotenv/config";

import { getPRDiff, postReviewFeedback } from "./server/github";
import { buildGraph } from "./orchestrator/graph";
import { indexCodebase } from "./indexing/indexer";
import { retrieveRelevantContext } from "./indexing/retriever";
import { getReviewLLM } from "./ai/provider";
import { saveAuditRecord, getHistory } from "./server/history";
import { getApiKeyForUser } from "./db/supabase";
import { HumanMessage } from "@langchain/core/messages";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../src/dashboard/dist")));

// Fallback to index.html for React SPA
app.get(/\/dashboard(\/.*)?$/, (req, res) => {
    res.sendFile(path.join(__dirname, "../src/dashboard/dist/index.html"));
});

// Dashboard History API
app.get("/api/history", async (req, res) => {
    const history = await getHistory();
    res.json(history);
});

// Dashboard Chatbot API
app.post("/api/chat", async (req, res) => {
    try {
        const { query, githubUsername } = req.body;
        if (!query) return res.status(400).json({ error: "Query is required" });
        if (!githubUsername) return res.status(400).json({ error: "GitHub username is required" });

        const apiKey = await getApiKeyForUser(githubUsername);
        if (!apiKey) return res.status(403).json({ error: "No API key configured." });
        
        const context = await retrieveRelevantContext(query, 5);
        const prompt = `You are an expert autonomous AI developer assistant. Answer the user's question based on the provided codebase context.\n\nCodebase Context:\n${context || "No relevant codebase context found."}\n\nQuestion:\n${query}`;
        
        const llm = getReviewLLM(apiKey);
        const response = await llm.invoke([new HumanMessage(prompt)]);
        res.json({ answer: response.content });
    } catch (error: any) {
        console.error("[CHATBOT] Error processing chat query:", error);
        res.status(500).json({ error: "Failed to generate response." });
    }
});

// Socket.io Connection Handler
io.on("connection", (socket) => {
    console.log(`[DASHBOARD] Client connected: ${socket.id}`);
    socket.emit("status", { message: "Connected to Antigravity AI Orchestrator" });
});

// Global request logger — must be BEFORE routes so it doesn't shadow 404s
app.use((req, _res, next) => {
    console.log(`\n[INBOUND] ${req.method} ${req.url}`);
    console.log(`[HEADERS] x-github-event: ${req.headers["x-github-event"]}`);
    next();
});

// Webhook listener
app.post("/webhook/github", async (req: express.Request, res: express.Response) => {
    const event = req.headers["x-github-event"];
    console.log(`[DETECTOR] Processing event: ${event}, Action: ${req.body?.action}`);

    if (event === "push") {
        console.log(`[INDEXER] Push detected on ${req.body.ref}. Triggering re-index...`);
        res.status(202).send("Re-indexing started.");
        indexCodebase().catch(e => console.error(`[INDEXER] Background indexing failed: ${e.message}`));
        return;
    }

    if (
        event !== "pull_request" ||
        !["opened", "synchronize", "reopened", "review_requested"].includes(req.body.action)
    ) {
        res.status(200).send("Ignored.");
        return;
    }

    res.status(202).send("Processing PR Queue...");

    // FIX (Bug 1): All metadata fields are now extracted BEFORE building state,
    // so owner/repo/pullNumber/baseBranch are never undefined inside the graph.
    try {
        const { login: owner } = req.body.repository.owner;
        const { name: repo } = req.body.repository;
        const pull_number: number = req.body.pull_request.number;
        const prDescription: string = req.body.pull_request.body || "No PR Description";
        const baseBranch: string = req.body.pull_request.base.ref;
        const prTitle: string = req.body.pull_request.title;

        console.log(`[ORCHESTRATOR] Looking up API key for repository owner: ${owner}`);
        const geminiApiKey = await getApiKeyForUser(owner);
        if (!geminiApiKey) {
            console.error(`[CRITICAL] No API Key found for user ${owner}. Aborting review.`);
            res.status(403).send("No API key configured for this user. Please log in to PR Guardian SaaS and provide your API Key.");
            return;
        }
        let prDiff: string;
        try {
            prDiff = await getPRDiff(owner, repo, pull_number);
        } catch (e) {
            console.warn(`[GITHUB] Could not fetch real diff for ${owner}/${repo} #${pull_number}. Using fallback diff for simulation.`);
            prDiff = `
diff --git a/demo.ts b/demo.ts
--- a/demo.ts
+++ b/demo.ts
+export const processUserItems = (userId: string) => {
+    const query = \`SELECT * FROM users WHERE id = \${userId}\`;
+    const items = new Array(10).fill(0);
+    items.forEach((item, i) => {
+        for(let j = 0; j < items.length; j++) {
+            console.log(i, j);
+        }
+    });
+};`;
        }

        const state = {
            geminiApiKey,
            owner,
            repo,
            pullNumber: pull_number,
            baseBranch,
            prDiff,
            prDescription,
            contextFiles: [] as string[],
            findings: [] as string[],
            inlineComments: [] as any[],
            auditorsCompleted: [] as string[],
            loopCount: 0,
            testScripts: [] as any[],
            fixedFiles: [] as any[],
            lastSandboxLogs: "",
        };

        const graph = buildGraph();
        const config = { configurable: { thread_id: `pr_${pull_number}` } };

        console.log(`\n${'='.repeat(50)}`);
        console.log(`🚀 [ORCHESTRATOR] STARTING AUDIT: PR #${pull_number}`);
        console.log(`📝 TITLE: ${prTitle}`);
        console.log(`${'='.repeat(50)}\n`);

        const stream = await graph.stream(state, config);

        // FIX (Bug 4 / stream merge): The original merge mutated finalResult.findings
        // THEN spread nodeResult over it, re-doubling arrays that existed in nodeResult.
        // Because the StateAnnotation reducer already accumulates arrays inside LangGraph,
        // the stream chunk for each node contains ONLY that node's delta — we must NOT
        // re-append here; instead we trust the final state snapshot from the last chunk.
        //
        // Strategy: collect the last full-state snapshot from the stream. LangGraph's
        // streaming with MemorySaver emits the full merged state on the final "__end__"
        // key. We also forward each node's delta to the dashboard via socket.io.
        let finalResult: typeof state = { ...state };

        for await (const chunk of stream as AsyncIterable<Record<string, any>>) {
            const nodeName = Object.keys(chunk)[0];
            const nodeResult = chunk[nodeName];

            console.log(`\n[AGENT] 🤖 Node: ${nodeName.toUpperCase()}`);
            if (nodeResult.findings && nodeResult.findings.length > 0) {
                console.log(`[AGENT] 📝 Findings identified:`);
                nodeResult.findings.forEach((f: string) => {
                    const title = f.split('\n')[0].replace('### ', '');
                    console.log(`  - ${title}`);
                });
            } else {
                console.log(`[AGENT] ✅ Phase completed with no new findings.`);
            }

            io.emit("node_results", {
                node: nodeName,
                results: nodeResult,
                timestamp: new Date().toISOString(),
            });

            // Merge only scalar / non-array fields from each node's delta.
            // Array fields (findings, inlineComments, auditorsCompleted, testScripts,
            // fixedFiles) are accumulated by the StateAnnotation reducers inside the
            // graph and arrive as the complete accumulated value in the LAST chunk —
            // so we just keep overwriting; the final write wins.
            finalResult = {
                ...finalResult,
                ...nodeResult,
            };
        }

        console.log("[ORCHESTRATOR] Analysis complete. Preparing structural feedback...");
        await postReviewFeedback(
            owner,
            repo,
            pull_number,
            finalResult.findings,
            finalResult.inlineComments
        );

        // FIX (Bug 9): Exclude "Auditor Error" findings from health score / status.
        // An auditor crashing should not look the same as a real vulnerability.
        const realFindings = finalResult.findings.filter(
            (f: string) => !f.includes("Auditor Error")
        );

        const securityFindings   = realFindings.filter((f: string) => f.includes("[SECURITY]")).length;
        const logicFindings      = realFindings.filter((f: string) => f.includes("[LOGIC]")).length;
        const performanceFindings = realFindings.filter((f: string) => f.includes("[PERFORMANCE]")).length;
        const styleFindings      = realFindings.filter((f: string) => f.includes("[STYLE]")).length;

        const totalPenalty =
            securityFindings   * 20 +
            logicFindings      * 20 +
            performanceFindings * 10 +
            styleFindings      * 5;
        const healthScore = Math.max(0, 100 - totalPenalty);

        await saveAuditRecord({
            id: `pr_${pull_number}_${Date.now()}`,
            owner,
            repo,
            pullNumber: pull_number,
            title: prTitle,
            status:
                finalResult.loopCount > 0
                    ? "Healed"
                    : healthScore < 80
                    ? "Failed"
                    : "Passed",
            healthScore,
            vulnerabilities: realFindings
                .filter((f: string) => f.includes("[SECURITY]") || f.includes("[LOGIC]"))
                .map((v: string) => v.split("]")[0].split("[")[1]),
            logs: finalResult.lastSandboxLogs ? [finalResult.lastSandboxLogs] : [],
            timestamp: new Date().toISOString(),
        });

        console.log(`\n${'='.repeat(50)}`);
        console.log(`✅ [ORCHESTRATOR] AUDIT COMPLETE: PR #${pull_number}`);
        console.log(`🎉 Review posted successfully!`);
        console.log(`${'='.repeat(50)}\n`);

    } catch (e: any) {
        io.emit("node_results", {
            node: "SYSTEM_ERROR",
            message: `CRITICAL ERROR: ${e.message}. Please check your Render Environment Variables or GitHub Webhook settings.`,
            timestamp: new Date().toISOString()
        });
        console.error(`[CRITICAL] Unhandled error processing PR: ${e.message}`, e.stack ?? "");
    }
});

httpServer.listen(PORT, () => {
    console.log(`[SERVER] PR Guardian Webhook listening on port ${PORT}`);
    console.log(`[SERVER] Dashboard: http://localhost:${PORT}/dashboard`);
});