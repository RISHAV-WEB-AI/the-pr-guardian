"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graph_1 = require("../src/orchestrator/graph");
const MOCK_PR_STATE = {
    prDiff: `
+ export const findUserAndToken = (id) => {
+    let x = 0;
+    const users = db.query(\`SELECT * FROM users WHERE id = \${id}\`);
+    let u = users[0];
+    for(let i=0; i<users.length; i++){
+        users.forEach(u => x++);
+    }
+    return u;
+ }
+ export const updateAuthToken = (newArg) => {};
    `,
    prDescription: "Refactor: Optimized the user auth query and changed token signature.",
    contextFiles: ["Auth.js", "Payment.cpp"], // Note Payment.cpp dependency on Token
    findings: [],
    auditorsCompleted: []
};
async function executeMockReview() {
    console.log("==================================================");
    console.log("🚀 STARTING AI-POWERED AUTONOMOUS CODE REVIEWER 🚀");
    console.log("==================================================");
    // Compile graph
    const workflowInfo = (0, graph_1.buildGraph)();
    // Config object
    const config = { configurable: { thread_id: "pr_review_123" } };
    // Invoke the multi-agent graph with mock PR state
    const result = await workflowInfo.invoke(MOCK_PR_STATE, config);
    console.log("\n==================================================");
    console.log("                 REVIEW REPORT                      ");
    console.log("==================================================");
    if (!result.findings || result.findings.length === 0) {
        console.log("✅ LGTM - No Issues Found.");
    }
    else {
        result.findings.forEach((finding, index) => {
            console.log(`\n--- Finding #${index + 1} ---`);
            console.log(finding);
        });
    }
}
executeMockReview().catch(console.error);
