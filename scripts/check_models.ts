import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function checkModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.0-pro"];
  
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent("hi");
      console.log(`✅ ${m} is accessible.`);
    } catch (e: any) {
      console.log(`❌ ${m}: ${e.message.split('\n')[0]}`);
    }
  }
}

checkModels();
