import { exec } from "child_process";
import * as fs from "fs";

/**
 * 🚨 TEST V2: COMPREHENSIVE BUG REPOSITORY 🚨
 * 
 * 1. STYLE: Poor naming, no types, giant function.
 * 2. SECURITY: SQL Injection, Hardcoded Secret.
 * 3. PERFORMANCE: Memory Leak (Growing global array).
 * 4. LOGIC: Exception swallowing, Race condition.
 */

const LEAKY_CACHE = []; // --- PERFORMANCE: Memory leak ---

export const do_everything_function = (input_data: any) => {
    
    // --- STYLE: Hardcoded variable naming ---
    const a = "AKIAIOSFODNN7EXAMPLE"; // --- SECURITY: Hardcoded AWS Key ---
    
    // --- PERFORMANCE: Unbounded array growth ---
    LEAKY_CACHE.push(input_data);

    // --- LOGIC: Swallowing exceptions ---
    try {
        const parsed = JSON.parse(input_data);
    } catch (e) {
        // Just ignore it, what could go wrong?
    }

    // --- SECURITY: SQL Injection vulnerability ---
    const query = `SELECT * FROM users WHERE id = '${input_data.id}'`;
    console.log("Executing query: " + query);

    // --- STYLE: Messy indentation and logic ---
    if(input_data.type == "admin"){
    if(input_data.password == "12345"){
    console.log("Login success");
    }
    }

    // --- INTEGRATION: Calling non-existent internal helper ---
    const helper = require("./utils/missing_helper");
    helper.initialize();

    return true;
}

// --- LOGIC: Off-by-one in a loop ---
export const processItems = (items: any[]) => {
    for (let i = 0; i <= items.length; i++) {
        console.log(items[i].name);
    }
}
