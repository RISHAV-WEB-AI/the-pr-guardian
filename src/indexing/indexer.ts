import { SimpleMemoryVectorStore } from "./memory_store";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embeddings } from "../ai/provider";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import "dotenv/config";

const DIRECTORY_TO_INDEX = path.join(process.cwd(), "src");
let vectorStore: SimpleMemoryVectorStore | null = null;

/**
 * Recursively scans a directory for code files asynchronously.
 */
async function getAllCodeFiles(dir: string): Promise<string[]> {
    const fileList: string[] = [];
    const files = await fs.readdir(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
            if (file !== "node_modules" && !file.startsWith(".")) {
                const subFiles = await getAllCodeFiles(filePath);
                fileList.push(...subFiles);
            }
        } else {
            if (/\.(ts|js|tsx|jsx)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

/**
 * Indexes the entire codebase into an in-memory vector store.
 */
export async function indexCodebase() {
    console.log(`[INDEXER] 🔍 Scanning codebase in: ${DIRECTORY_TO_INDEX}`);

    if (!existsSync(DIRECTORY_TO_INDEX)) {
        console.warn(`[INDEXER] ⚠️  Directory to index does not exist: ${DIRECTORY_TO_INDEX}`);
        return;
    }

    const files = await getAllCodeFiles(DIRECTORY_TO_INDEX);
    console.log(`[INDEXER] Found ${files.length} code files.`);

    const documents = [];
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    for (const file of files) {
        try {
            const content = await fs.readFile(file, "utf-8");
            const relativePath = path.relative(process.cwd(), file);

            const chunks = await splitter.createDocuments(
                [content],
                [{ source: relativePath }]
            );
            documents.push(...chunks);
        } catch (err: any) {
            console.warn(`[INDEXER] ⚠️  Skipping unreadable file: ${file} — ${err.message}`);
        }
    }

    if (documents.length === 0) {
        console.warn("[INDEXER] ⚠️  No documents to index. Vector store will not be created.");
        return;
    }

    console.log(`[INDEXER] 📝 Creating Memory index for ${documents.length} code chunks...`);

    try {
        vectorStore = await SimpleMemoryVectorStore.fromDocuments(documents, embeddings);
        console.log(`[INDEXER] ✅ Codebase successfully indexed in memory.`);
    } catch (err: any) {
        console.error(`[INDEXER] ❌ Failed to create/save vector store: ${err.message}`);
        if (err.message.includes("404") || err.message.includes("not found")) {
            console.error("[INDEXER] Hint: The embedding model might be unavailable in your region or misspelled.");
        }
        throw err;
    }
}


export async function getVectorStore() {
    if (vectorStore) {
        return vectorStore;
    }

    try {
        await indexCodebase();
    } catch (err) {
        console.error("[INDEXER] Background indexing failed:", err);
    }
    return vectorStore;
}

// Support for running directly
if (require.main === module) {
    indexCodebase().catch(console.error);
}