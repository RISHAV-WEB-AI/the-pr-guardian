import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-pro" }).generateContent("Hi");
        console.log("Gemini Pro Test SUCCESS:", models.response.text());
    } catch (e: any) {
        console.error("Gemini Pro Test FAILED:", e.message);
    }
}

listModels();
