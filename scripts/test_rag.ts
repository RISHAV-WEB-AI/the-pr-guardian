import { indexCodebase, getVectorStore } from "../src/indexing/indexer";
import { retrieveRelevantContext } from "../src/indexing/retriever";

async function test() {
    console.log("--- Starting Indexer Test ---");
    try {
        await indexCodebase();
        console.log("Indexing complete.");

        const query = "how does the security auditor work?";
        console.log(`Searching for: ${query}`);
        const context = await retrieveRelevantContext(query);
        console.log("Retrieved Context:");
        console.log(context.slice(0, 500) + "...");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
