import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function listAllModels() {
    // Note: The @google/generative-ai SDK might not have a direct listModels on the main class in all versions
    // Usually it's available via a separate client or a specific endpoint
    // But we can try to fetch the models list via a simple fetch if needed.
    console.log("Fetching models list via REST...");
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log("No models found in response:", JSON.stringify(data));
        }
    } catch (e: any) {
        console.error("Failed to list models:", e.message);
    }
}

listAllModels();
