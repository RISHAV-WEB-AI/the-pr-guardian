import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { getPRDiff, postReviewFeedback } from "./github";
import { buildGraph } from "../orchestrator/graph";
import { saveAuditRecord } from "./history";

export const webhookRouter = express.Router();
webhookRouter.use(bodyParser.json());

webhookRouter.post("/github", async (req: Request, res: Response): Promise<void> => {
  const event = req.headers["x-github-event"];
  if (event !== "pull_request") {
    res.status(200).send("Ignored event type");
    return;
  }

  const action = req.body.action;
  if (!["opened", "synchronize", "reopened"].includes(action)) {
    res.status(200).send("Ignored PR action type");
    return;
  }

  const owner = req.body.repository.owner.login;
  const repo = req.body.repository.name;
  const pull_number: number = req.body.pull_request.number;
  const prDescription: string = req.body.pull_request.body || "";
  const prTitle: string = req.body.pull_request.title || "";
  // BUG 1 FIX (partial): extract baseBranch from the webhook payload so the
  // pusher node can create fix branches off the correct base.
  const baseBranch: string = req.body.pull_request.base.ref;

  console.log(`[WEBHOOK] PR Event -> ${owner}/${repo}#${pull_number}`);

  // Return 202 immediately so GitHub doesn't timeout the webhook.
  res.status(202).send("Processing PR Queue...");

  (async () => {
    try {
      console.log(`[ORCHESTRATOR] Starting AI review for ${owner}/${repo}#${pull_number}`);

      const prDiff = await getPRDiff(owner, repo, pull_number);
      const graph = buildGraph();

      // BUG 1 FIX: The old code passed ONLY { prDiff, prDescription }.
      // owner, repo, pullNumber, and baseBranch were never in the graph state,
      // so pusherAuditorNode had undefined values for all GitHub API calls.
      // Now we pass the full initial state.
      const finalState = await graph.invoke(
        {
          owner,
          repo,
          pullNumber: pull_number,
          baseBranch,
          prDiff,
          prDescription,
          // Initialise all array fields explicitly to avoid undefined concat errors
          contextFiles: [],
          domains: [],
          findings: [],
          inlineComments: [],
          auditorsCompleted: [],
          testScripts: [],
          fixedFiles: [],
          loopCount: 0,
        },
        { configurable: { thread_id: `pr-${pull_number}` } }
      );

      // BUG 1 FIX (second part): inline comments were collected by all auditors
      // but postReviewFeedback was called with only findings — comments were
      // silently dropped and never posted to GitHub.
      await postReviewFeedback(
        owner,
        repo,
        pull_number,
        finalState.findings,
        finalState.inlineComments  // <-- was missing
      );

      // BUG 7 FIX: history.ts::saveAuditRecord was never called anywhere.
      // The history system was fully built but completely disconnected.
      const highFindings = finalState.findings.filter(
        (f: string) => f.includes("[HIGH]") && !f.includes("Auditor Error")
      );
      const wasHealed = finalState.fixedFiles?.length > 0;
      const healthScore = Math.max(0, 100 - highFindings.length * 20);

      await saveAuditRecord({
        id: `${repo}-${pull_number}-${Date.now()}`,
        owner,
        repo,
        pullNumber: pull_number,
        title: prTitle,
        status: wasHealed ? "Healed" : highFindings.length > 0 ? "Failed" : "Passed",
        healthScore,
        vulnerabilities: highFindings,
        logs: finalState.lastSandboxLogs ? [finalState.lastSandboxLogs] : [],
        timestamp: new Date().toISOString(),
      }).catch(e => console.warn(`[HISTORY] Failed to save record: ${e.message}`));

      console.log(`[ORCHESTRATOR] Review complete for PR #${pull_number}`);
    } catch (error: any) {
      console.error(`[ORCHESTRATOR] Fatal error: ${error.message}`);
    }
  })();
});
