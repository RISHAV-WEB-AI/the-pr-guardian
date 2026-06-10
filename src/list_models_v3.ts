import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  // The correct method is genAI.listModels()
  const result = await (genAI as any).listModels();
  
  // Filter for models that support embedding
  const embedModels = result.models.filter((m: any) => 
    m.supportedGenerationMethods?.includes("embedContent")
  );
  console.log(JSON.stringify(embedModels, null, 2));
}

listModels().catch(console.error);
