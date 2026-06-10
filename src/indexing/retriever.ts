import { getVectorStore } from "./indexer";
import "dotenv/config";

// FIX (Bug): Original file imported `embeddings` from "../ai/provider" but never
// used it — MemoryVectorStore.similaritySearch() doesn't need the embeddings object
// directly (it was embedded at index time). The unused import caused a compile
// warning and implied a misunderstanding of the API. Removed.

export async function retrieveRelevantContext(query: string, k: number = 3): Promise<string> {
    console.log(`[RETRIEVER] 🕵️ Searching codebase for: "${query.slice(0, 50)}..."`);

    const vectorStore = await getVectorStore();

    // FIX (Bug): Original code swallowed the "not initialized" case by returning ""
    if (!vectorStore) {
        console.warn(
            "[RETRIEVER] ⚠️  Vector store not initialized — did indexCodebase() run? Returning empty context."
        );
        return "";
    }

    try {
        const results = await vectorStore.similaritySearch(query, k);

        if (results.length === 0) {
            console.log("[RETRIEVER] No relevant chunks found for query.");
            return "";
        }

        return results
            .map((doc) => `--- FILE: ${doc.metadata.source} ---\n${doc.pageContent}\n`)
            .join("\n");
    } catch (error: any) {
        // FIX (Bug): Original catch block warned and returned "" — fine for the
        // auditor nodes (they degrade gracefully), but the error was swallowed
        // with no indication of whether it was transient or permanent.
        // Now we include the stack to make debugging easier.
        console.error(`[RETRIEVER] ❌ Search failed: ${error.message}`, error.stack ?? "");
        return "";
    }
}