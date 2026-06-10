import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function checkModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-8b",
    "gemini-pro"
  ];
  
  console.log("Testing model names...");
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent("hi");
      console.log(`✅ ${m}: SUCCESS`);
    } catch (e: any) {
      const msg = e.message.toLowerCase();
      if (msg.includes("429") || msg.includes("quota")) {
        console.log(`⚠️ ${m}: QUOTA EXCEEDED (But model exists)`);
      } else if (msg.includes("404") || msg.includes("not found")) {
        console.log(`❌ ${m}: NOT FOUND`);
      } else {
        console.log(`❓ ${m}: ${e.message.split('\n')[0]}`);
      }
    }
  }
}

checkModels();
