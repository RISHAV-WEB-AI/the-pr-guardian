import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";

export class SimpleMemoryVectorStore {
    private documents: Document[] = [];
    private embeddings: number[][] = [];
    private embeddingModel: Embeddings;

    constructor(embeddingModel: Embeddings) {
        this.embeddingModel = embeddingModel;
    }

    static async fromDocuments(documents: Document[], embeddings: Embeddings): Promise<SimpleMemoryVectorStore> {
        const store = new SimpleMemoryVectorStore(embeddings);
        await store.addDocuments(documents);
        return store;
    }

    async addDocuments(documents: Document[]): Promise<void> {
        const texts = documents.map(doc => doc.pageContent);
        const newEmbeddings = await this.embeddingModel.embedDocuments(texts);
        
        this.documents.push(...documents);
        this.embeddings.push(...newEmbeddings);
    }

    async similaritySearch(query: string, k: number = 3): Promise<Document[]> {
        const queryEmbedding = await this.embeddingModel.embedQuery(query);
        
        // Calculate cosine similarity
        const scores = this.embeddings.map((emb, index) => ({
            index,
            score: this.cosineSimilarity(queryEmbedding, emb)
        }));

        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);

        // Return top k documents
        return scores.slice(0, k).map(s => this.documents[s.index]);
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
