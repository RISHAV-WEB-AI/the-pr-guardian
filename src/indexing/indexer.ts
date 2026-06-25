import { SimpleMemoryVectorStore } from "./memory_store";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEmbeddings } from "../ai/provider";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import "dotenv/config";

const execAsync = promisify(exec);

// Cache per owner/repo
const vectorStoreCache = new Map<string, SimpleMemoryVectorStore>();

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
            if (/\.(ts|js|tsx|jsx|py|go|rs|md|json)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

/**
 * Indexes the specified repository codebase into an in-memory vector store.
 */
export async function indexRepository(owner: string, repo: string, apiKey: string): Promise<SimpleMemoryVectorStore | null> {
    const repoKey = `${owner}/${repo}`;
    console.log(`[INDEXER] 🔍 Indexing repository: ${repoKey}`);

    const tmpDir = path.join(os.tmpdir(), "pr-guardian-index", repoKey.replace("/", "-"));
    
    try {
        // Clean up previous if exists
        if (existsSync(tmpDir)) {
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
        await fs.mkdir(tmpDir, { recursive: true });

        console.log(`[INDEXER] 📥 Cloning repository ${repoKey} into temporary directory...`);
        // We use shallow clone for speed
        const cloneUrl = `https://github.com/${owner}/${repo}.git`;
        await execAsync(`git clone --depth 1 ${cloneUrl} "${tmpDir}"`);
        
        const files = await getAllCodeFiles(tmpDir);
        console.log(`[INDEXER] Found ${files.length} code files in ${repoKey}.`);

        const documents = [];
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        for (const file of files) {
            try {
                const content = await fs.readFile(file, "utf-8");
                const relativePath = path.relative(tmpDir, file);

                const chunks = await splitter.createDocuments(
                    [content],
                    [{ source: relativePath, repo: repoKey }]
                );
                documents.push(...chunks);
            } catch (err: any) {
                console.warn(`[INDEXER] ⚠️  Skipping unreadable file: ${file} — ${err.message}`);
            }
        }

        if (documents.length === 0) {
            console.warn(`[INDEXER] ⚠️  No documents to index for ${repoKey}.`);
            return null;
        }

        console.log(`[INDEXER] 📝 Creating Memory index for ${documents.length} code chunks...`);

        const embeddings = getEmbeddings(apiKey);
        const store = await SimpleMemoryVectorStore.fromDocuments(documents, embeddings);
        
        vectorStoreCache.set(repoKey, store);
        console.log(`[INDEXER] ✅ Codebase for ${repoKey} successfully indexed in memory.`);
        return store;
        
    } catch (err: any) {
        console.error(`[INDEXER] ❌ Failed to index repository ${repoKey}: ${err.message}`);
        throw err;
    } finally {
        // Clean up tmp dir to free space
        if (existsSync(tmpDir)) {
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(e => console.warn("Failed to clean tmp dir:", e));
        }
    }
}

export async function getVectorStore(owner: string, repo: string, apiKey: string): Promise<SimpleMemoryVectorStore | null> {
    const repoKey = `${owner}/${repo}`;
    
    if (vectorStoreCache.has(repoKey)) {
        return vectorStoreCache.get(repoKey)!;
    }

    try {
        const store = await indexRepository(owner, repo, apiKey);
        return store;
    } catch (err) {
        console.error(`[INDEXER] Background indexing failed for ${repoKey}:`, err);
        return null;
    }
}