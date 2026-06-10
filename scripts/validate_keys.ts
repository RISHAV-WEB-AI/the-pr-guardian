import { Octokit } from "@octokit/rest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function validateTokens() {
  console.log("🔍 Validating Credentials...");

  // 1. Validate GitHub Token
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  try {
    const { data } = await octokit.users.getAuthenticated();
    console.log(`✅ GitHub Token is VALID. Authenticated as: ${data.login}`);
  } catch (error: any) {
    console.error(`❌ GitHub Token is INVALID: ${error.message}`);
  }

  // 2. Validate Google AI Key
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  try {
    // Testing with gemini-2.0-flash as configured in the app
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("hi");
    if (result.response.text()) {
      console.log("✅ Google API Key is VALID and gemini-2.0-flash is accessible.");
    }
  } catch (error: any) {
    console.error(`❌ Google API Key issue with gemini-2.0-flash: ${error.message}`);
    
    // Fallback check with gemini-pro
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      await model.generateContent("hi");
      console.log("✅ Google API Key is VALID (verified via gemini-pro).");
    } catch (e2: any) {
      console.error(`❌ Google API Key is likely INVALID: ${e2.message}`);
    }
  }
}

validateTokens();
