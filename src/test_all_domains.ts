import fs from "fs";
import { execSync } from "child_process";
import crypto from "crypto";

// ============================================================================
// 🚨 COMPREHENSIVE AI REVIEWER TEST HARNESS 🚨
// This file intentionally contains bugs that trigger every AI Auditor domain.
// ============================================================================

// --- 1. INTEGRATION BUG ---
// Calling an internal module that doesn't exist, breaking cross-file dependencies.
import { fetchLegacyUserData } from "./legacy_database_connector";

export const processUserUpload = async (req: any, res: any) => {

    // --- 2. STYLE BUG ---
    // Poor naming conventions, lack of types, unused variables, messy indentation
    var Xx_data_xX = req.body;
    let unused_var = "I am never used";
         if(Xx_data_xX.id==null){
    console.log("No ID");
             }

    // --- 3. SECURITY BUG ---
    // Command Injection vulnerability (passing unsanitized user input into execSync)
    // Weak Crypto (using MD5 instead of SHA-256 or bcrypt)
    const backupCommand = `tar -czf backup.tar.gz /uploads/${Xx_data_xX.folderName}`;
    execSync(backupCommand); 

    const weakHash = crypto.createHash('md5').update(Xx_data_xX.password).digest("hex");

    // --- 4. LOGIC BUG ---
    // Logical flaw where the server sends a response but continues executing,
    // leading to "headers already sent" crash. Also an off-by-one array error.
    if (!Xx_data_xX.isAdmin) {
        res.status(403).send("Forbidden");
        // Missing 'return' statement here!
    }

    const items = [1, 2, 3];
    const invalidItem = items[items.length]; // Array bounds off-by-one

    // --- 5. PERFORMANCE BUG ---
    // O(N^3) nested loop doing useless operations, freezing the Node.js event loop
    let dummySum = 0;
    for (let i = 0; i < 1000; i++) {
        for (let j = 0; j < 1000; j++) {
            for (let k = 0; k < 100; k++) {
                dummySum += (i * j * k);
            }
        }
    }

    // Attempting to call the missing integration function
    const legacyData = fetchLegacyUserData(Xx_data_xX.id);

    res.status(200).send({ status: "success", hash: weakHash, dummySum });
};