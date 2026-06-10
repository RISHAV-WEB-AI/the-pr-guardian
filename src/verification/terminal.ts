import * as fs from "fs/promises";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Refactored Verification Engine: Local Execution Simulation
const DOCKER_OUTPUT_DIR = path.join(process.cwd(), "docker_tests");

export const generateAndQueueTerminalTest = async (
    testName: string,
    scriptContent: string
): Promise<{ success: boolean; log: string }> => {
    console.log(`[Terminal Agent] Sandboxing: Running execution -> ${testName}`);

    // FIX (Security): Sanitize testName to prevent path traversal / shell injection.
    const safeTestName = path.basename(testName).replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!safeTestName) {
        return { success: false, log: "Invalid testName: resolved to empty string after sanitization." };
    }

    try {
        await fs.mkdir(DOCKER_OUTPUT_DIR, { recursive: true });
        const scriptPath = path.join(DOCKER_OUTPUT_DIR, safeTestName);
        await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });

        try {
            // FIX (Security): Use execFile instead of execSync to avoid shell execution.
            // This prevents command injection vulnerabilities from the PoC script path.
            const { stdout, stderr } = await execFileAsync("node", [scriptPath], {
                timeout: 5000,
            });
            return { success: true, log: (stdout + stderr).trim() };
        } catch (error: any) {
            const stdout = error.stdout ?? "";
            const stderr = error.stderr ?? "";
            const log = (stdout + stderr).trim() || error.message;
            return { success: false, log };
        }
    } catch (error: any) {
        return { success: false, log: `I/O Error: ${error.message}` };
    }
};