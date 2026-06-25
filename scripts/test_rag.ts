import { getVectorStore } from "../src/indexing/indexer";
import { retrieveRelevantContext } from "../src/indexing/retriever";

async function test() {
    console.log("--- Starting Indexer Test ---");
    try {
        const owner = "RISHAV-WEB-AI";
        const repo = "the-pr-guardian";
        const apiKey = process.env.GOOGLE_API_KEY || "";
        
        await getVectorStore(owner, repo, apiKey);
        console.log("Indexing complete.");

        const query = "how does the security auditor work?";
        console.log(`Searching for: ${query}`);
        const context = await retrieveRelevantContext(query, owner, repo, apiKey);
        console.log("Retrieved Context:");
        console.log(context.slice(0, 500) + "...");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
