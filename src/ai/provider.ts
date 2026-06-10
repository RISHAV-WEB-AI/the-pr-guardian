import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import "dotenv/config";

// Factory for Standard Review LLM — high speed, large context
export const getReviewLLM = (apiKey: string) => {
  if (!apiKey) throw new Error("No Gemini API key provided for this tenant.");
  return new ChatGoogleGenerativeAI({
    model: "gemini-3.1-flash-lite-preview", 
    apiKey: apiKey,
    temperature: 0.1,
  });
};

// Factory for Premium LLM — used for Logic, Style, Integration, and Fixer nodes
export const getPremiumLLM = (geminiApiKey: string) => {
  return process.env.ANTHROPIC_API_KEY
    ? new ChatAnthropic({
        model: "claude-3-5-sonnet-latest",
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0,
      })
    : new ChatGoogleGenerativeAI({
        model: "gemini-3-pro-preview",  
        apiKey: geminiApiKey,
        temperature: 0,
      });
};

// Factory for Embeddings
export const getEmbeddings = (apiKey: string) => {
  return new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001", 
    apiKey: apiKey,
  });
};

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001", 
  apiKey: process.env.GOOGLE_API_KEY,
});
