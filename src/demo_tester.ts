import { buildGraph } from "./orchestrator/graph";
import "dotenv/config";

const demoDiff = `
diff --git a/demo.ts b/demo.ts
--- a/demo.ts
+++ b/demo.ts
+export const processUserItems = (userId: string) => {
+    // 1. Security Vulnerability (SQL Injection)
+    // The security auditor looks for string interpolation in SQL
+    const query = \`SELECT * FROM users WHERE id = \${userId}\`;
+    console.log("Executing:", query);
+
+    // 2. Performance Issue (O(n^2) loop)
+    // The performance auditor checks for "for" and "forEach" nested loops
+    const items = new Array(100).fill(0);
+    items.forEach((item, i) => {
+        for(let j = 0; j < items.length; j++) {
+            // N^2 iteration
+            console.log(i, j);
+        }
+    });
+};
`;

const demoDescription = "Feature: Process User Items. Refactoring the item logic to process stuff over an array.";

async function runDemo() {
    console.log("=========================================");
    console.log("🤖 LOCAL DEMO: AI CODE REVIEWER");
    console.log("=========================================");
    
    // Build initial state for the LangGraph workflow
    const state = {
        prDiff: demoDiff,
        prDescription: demoDescription,
        contextFiles: [],
        findings: [],
        auditorsCompleted: []
    };

    const workflowInfo = buildGraph();
    const config = { configurable: { thread_id: "demo_test_run" } };

    console.log("[ORCHESTRATOR] Graph configured. Sending code snippet into pipeline...\n");

    try {
        const result: any = await workflowInfo.invoke(state, config);

        console.log("\n=========================================");
        console.log("✅ REVIEW COMPLETE");
        console.log("=========================================");
        
        if (result.findings && result.findings.length > 0) {
            console.log("Generating Final Report:\n");
            result.findings.forEach((finding: string, index: number) => {
                console.log(`--- [Issue ${index + 1}] ---`);
                console.log(finding);
                console.log("------------------\n");
            });
        } else {
            console.log("No issues found! Your code is perfect.");
        }

    } catch (e) {
        console.error("Pipeline failed!", e);
    }
}

runDemo();
