import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function listModels() {
  try {
    console.log("Checking API access and models...");
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("No GOOGLE_API_KEY found in environment!");
        return;
    }
    
    // Test 1: Direct Fetch Call to list models
    console.log("\n--- TEST 1: Direct API List ---");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data: any = await response.json();
    
    if (data.error) {
        console.error("API Key Rejected:", JSON.stringify(data.error, null, 2));
        return;
    }

    console.log("API Key is VALID.");
    
    const availableModels = data.models || [];
    console.log(`Found ${availableModels.length} models.`);

    // Test 2: Identify exact strings for Gemini
    console.log("\n--- TEST 2: Valid Gemini Names for generateContent ---");
    const generateModels = availableModels
        .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));
    
    console.log("Available for generation:", generateModels);

    // Test 3: Identify exact strings for Embeddings
    console.log("\n--- TEST 3: Valid Embedding Names ---");
    const embedModels = availableModels
        .filter((m: any) => m.supportedGenerationMethods.includes("embedContent"))
        .map((m: any) => m.name.replace("models/", ""));
    
    console.log("Available for embedding:", embedModels);

  } catch (e) {
    console.error("CRITICAL ERROR during check:", e);
  }
}

listModels();
