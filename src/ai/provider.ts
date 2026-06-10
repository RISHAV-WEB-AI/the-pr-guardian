import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import "dotenv/config";

// BUG 10 FIX: Pinned to stable model versions.
// "gemini-flash-latest" is a moving alias — a silent model update can break
// your JSON output format and hurt review accuracy with no error thrown.
// "claude-3-5-sonnet-20240620" was stale; updated to current Sonnet.

// Standard Review LLM — high speed, large context for diff ingestion
export const reviewLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview", 
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.1,
});

// Premium LLM — used for Logic, Style, Integration, and Fixer nodes
// Falls back to Gemini Pro if no Anthropic key is configured
export const premiumLLM = process.env.ANTHROPIC_API_KEY
  ? new ChatAnthropic({
      model: "claude-3-5-sonnet-latest",   // update to latest
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0,
    })
  : new ChatGoogleGenerativeAI({
      model: "gemini-3-pro-preview",  
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0,
    });




// Embeddings for RAG / vectorstore
export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001", 
  apiKey: process.env.GOOGLE_API_KEY,
});

// BUG 3 NOTE: llm.ts was a dead re-export shim that created a second
// reviewLLM symbol pointing to the same object. It is kept for import
// compatibility (auditors import from "../ai/llm") but is now a clean
// single-line re-export. No behaviour change — just eliminates the confusion.
export const defaultLLM = reviewLLM;
