import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-pro" }); // Just to check connectivity
    console.log("Connected to Google AI.");
    
    // Using fetch to list models as LangChain doesn't expose it easily
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
    const data = await response.json();
    
    console.log("\nAvailable Models:");
    data.models.forEach((m: any) => {
      console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(", ")})`);
    });
  } catch (e: any) {
    console.error("Failed to list models:", e.message);
  }
}

listModels();
