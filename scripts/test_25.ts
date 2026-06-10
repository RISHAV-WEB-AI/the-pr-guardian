import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function test25() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const res = await model.generateContent("hi");
    console.log("✅ gemini-2.5-flash SUCCESS!");
  } catch (e: any) {
    console.log(`❌ gemini-2.5-flash: ${e.message}`);
  }
}

test25();
