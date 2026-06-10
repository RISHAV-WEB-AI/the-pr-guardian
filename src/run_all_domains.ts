import { buildGraph } from "./orchestrator/graph";
import fs from "fs";
import "dotenv/config";

async function runTest() {
    console.log("=========================================");
    console.log("🤖 RUNNING COMPREHENSIVE AI REVIEWER TEST");
    console.log("=========================================");
    
    // Read the newly created test file
    const demoDiff = fs.readFileSync("src/test_v2.ts", "utf8");

    const state = {
        prDiff: `diff --git a/test.ts b/test.ts\n--- a/test.ts\n+++ b/test.ts\n+${demoDiff}`,
        prDescription: "Testing all 5 AI domains: Security, Logic, Style, Performance, Integration.",
        contextFiles: [],
        findings: [],
        auditorsCompleted: []
    };

    const workflowInfo = buildGraph();
    const config = { configurable: { thread_id: "demo_test_run" } };

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

runTest();
