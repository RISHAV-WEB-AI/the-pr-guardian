import { buildGraph } from "./orchestrator/graph";

const longDemoDiff = `
diff --git a/backend/UserService.ts b/backend/UserService.ts
--- a/backend/UserService.ts
+++ b/backend/UserService.ts
@@ -1,5 +1,80 @@
+import db from "./database";
+import bcrypt from "bcrypt";
+import _ from "lodash";
+
+export class UserService {
+  
+  // Register user but misses salt generation properly and has some bad practices
+  public async registerUser(reqBody: any) {
+     const dbConn = await db.getConnection();
+     
+     // Intentional vulnerability 1: Raw SQL Injection using direct string concatenation
+     let q = "SELECT * FROM users WHERE email = '" + reqBody.email + "'";
+     let userExists = await dbConn.query(q);
+     
+     if (userExists) {
+         return { status: 400, message: "User exists already" };
+     }
+
+     // Intentional vulnerability 2: Insecure naive hashing (salt factor 2 is too low)
+     let hashedString = bcrypt.hashSync(reqBody.password, 2);
+     
+     // Intentional logic flaw: Redundant mutable state
+     let x = 0; 
+
+     // Intentional Performance problem: N+1 queries combined with async nested loops
+     let relatedAdmins = [];
+     let roles = await dbConn.query("SELECT * FROM roles");
+     roles.forEach((role: any) => {
+         dbConn.query("SELECT * FROM users WHERE role_id=" + role.id).then((users: any) => {
+             users.forEach((u: any) => {
+                if (u.isAdmin) {
+                    relatedAdmins.push(u);
+                }
+             });
+         });
+     });
+
+     // Intentional vulnerability 3: Raw SQL Injection using template literals
+     await dbConn.query(
+       \`INSERT INTO users (name, email, password) VALUES ('\${reqBody.name}', '\${reqBody.email}', '\${hashedString}')\`
+     );
+
+     return { status: 201, message: "User inserted." };
+  }
+
+  // Intentional performance flaw: Sync loop blocking the event loop (O(N^2))
+  public computeUserStats(users: any[]) {
+     let total = 0;
+     for(let i=0; i<users.length; i++) {
+        for(let j=0; j<10000; j++) {
+           total += Math.pow(users[i].score, j);
+        }
+     }
+     return total;
+  }
+}
+`;

const demoDescription = "Feature: Implement comprehensive User Service with registration, hashing, and performance stats.";

async function runLongDemo() {
    console.log("=========================================");
    console.log("🤖 LOCAL DEMO: COMPREHENSIVE AI REVIEWER");
    console.log("=========================================");
    
    // Build initial state for LangGraph
    const state = {
        prDiff: longDemoDiff,
        prDescription: demoDescription,
        contextFiles: [],
        findings: [],
        auditorsCompleted: []
    };

    const workflowInfo = buildGraph();
    const config = { configurable: { thread_id: "demo_test_long_run" } };

    console.log("[ORCHESTRATOR] Sending huge complex snippet to the AI Auditors...");
    console.log("Please wait, the AI is thinking deeply about improvements and errors...\n");

    try {
        const result: any = await workflowInfo.invoke(state, config);
        
        console.log("\n=========================================");
        console.log("✅ COMPREHENSIVE REVIEW COMPLETE");
        console.log("=========================================");
        
        if (result.findings && result.findings.length > 0) {
            result.findings.forEach((finding: string, index: number) => {
                console.log(`\n\x1b[36m--- [AI Finding / Suggestion ${index + 1}] ---\x1b[0m`);
                console.log(finding);
                console.log("\x1b[36m--------------------------------\x1b[0m");
            });
        } else {
            console.log("No issues found. Code is bulletproof!");
        }

    } catch (e) {
        console.error("Pipeline failed!", e);
    }
}

runLongDemo();
