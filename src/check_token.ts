import { Octokit } from "@octokit/rest";
import "dotenv/config";

async function checkToken() {
    const github = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    });

    try {
        const { headers } = await github.rest.users.getAuthenticated();
        console.log("------------------------------------------");
        console.log("TOKEN DIAGNOSTICS:");
        console.log(`- Authenticated as: ${headers["x-oauth-scopes"] ? "Classic Token" : "Fine-grained Token"}`);
        console.log(`- Scopes: ${headers["x-oauth-scopes"] || "None (or Fine-grained)"}`);
        
        if (headers["x-oauth-scopes"]) {
            const scopes = (headers["x-oauth-scopes"] as string).split(", ");
            if (!scopes.includes("repo")) {
                console.error("CRITICAL: Your token is missing the 'repo' scope!");
            } else {
                console.log("SUCCESS: Token has 'repo' scope.");
            }
        }
        console.log("------------------------------------------");
    } catch (error: any) {
        console.error(`DIAGNOSTIC ERROR: ${error.message}`);
    }
}

checkToken();
