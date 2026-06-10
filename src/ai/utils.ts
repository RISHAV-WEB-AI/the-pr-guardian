import { BaseMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const FALLBACK_MODELS = [
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-computer-use-preview-10-2025"
];

let currentModelIndex = 0;

// FIX 1: Added MIN_ROTATE_DELAY — when we rotate models due to a quota error
// we must still wait before hitting the next model, or we instantly exhaust
// the next quota too. Previously the code called `continue` with no delay
// on rotation, so all 20 retries could be burned in <1 second.
const MIN_ROTATE_DELAY_MS = 3000;

// FIX 2: Narrowed the `isMisleadingError` guard so a genuine invalid/revoked
// API key (a real auth failure) does NOT get treated as a transient error and
// silently rotate models forever. We only treat it as retriable when the error
// message also contains quota/rate language, which Google sometimes wraps in a
// 400 instead of a 429.
function isRetriable400(message: string): boolean {
    const lower = message.toLowerCase();
    return (
        message.includes("400") &&
        // Must look like a quota/billing issue, not just "invalid key"
        (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("billing"))
    );
}

export async function invokeWithRetry(
    llm: any,
    messages: BaseMessage[],
    maxRetries = 20,
    initialDelay = 1000
) {
    let lastError: any;
    let currentLLM = llm;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const modelLabel = currentLLM.model ?? currentLLM.modelName ?? "unknown";
            console.log(`[LLM] Calling model: ${modelLabel} (attempt ${i + 1}/${maxRetries})...`);
            return await currentLLM.invoke(messages);
        } catch (e: any) {
            lastError = e;
            const errorMessage = e.message || "";

            const isRateLimit =
                errorMessage.includes("429") ||
                errorMessage.toLowerCase().includes("too many requests") ||
                errorMessage.toLowerCase().includes("quota exceeded") ||
                errorMessage.toLowerCase().includes("rate limit");

            // FIX 2 applied here — narrowed predicate instead of the old broad check
            const isMisleading400 = isRetriable400(errorMessage);

            const isNetworkError =
                errorMessage.toLowerCase().includes("fetch failed") ||
                errorMessage.toLowerCase().includes("timeout") ||
                errorMessage.toLowerCase().includes("etimedout") ||
                errorMessage.toLowerCase().includes("socket") ||
                errorMessage.toLowerCase().includes("aborted");

            const is404 = errorMessage.includes("404") || errorMessage.toLowerCase().includes("not found");

            if (isRateLimit || isMisleading400 || isNetworkError || is404) {
                const delay = Math.min(10000, initialDelay * Math.pow(1.5, i));

                if (isRateLimit || isMisleading400 || is404) {
                    // For 404s, rotate immediately without delay
                    let rotateDelay = is404 ? 0 : Math.max(MIN_ROTATE_DELAY_MS, delay);
                    
                    // NEW: Parse exact retry delay from Google API if present
                    if (!is404 && errorMessage.includes("Please retry in")) {
                        const match = errorMessage.match(/Please retry in ([\d.]+)s/);
                        if (match) {
                            const seconds = parseFloat(match[1]);
                            rotateDelay = Math.max(rotateDelay, (seconds + 1) * 1000);
                            console.log(`[LLM] ⏳ API requested wait: ${seconds}s. Waiting ${rotateDelay}ms...`);
                        }
                    }

                    if (rotateDelay > 0) {
                        console.warn(
                            `[LLM] Quota issue. Waiting ${rotateDelay}ms then rotating model... (Attempt ${i + 1}/${maxRetries})`
                        );
                        await new Promise(resolve => setTimeout(resolve, rotateDelay));
                    } else {
                        console.warn(`[LLM] Model not found (404). Rotating immediately...`);
                    }


                    currentModelIndex = (currentModelIndex + 1) % FALLBACK_MODELS.length;
                    const nextModel = FALLBACK_MODELS[currentModelIndex];
                    console.warn(`[LLM] Rotating to: ${nextModel}`);

                    currentLLM = new ChatGoogleGenerativeAI({
                        model: nextModel,
                        apiKey: process.env.GOOGLE_API_KEY,
                        temperature: currentLLM.temperature ?? 0.1,
                    });
                } else {
                    console.warn(`[LLM] Network/transient error. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                continue;
            }
            
            // Even if not a quota error, add a small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 500));

            console.error(`[LLM] Non-retriable error: ${errorMessage}`);
            throw e;
        }
    }

    throw lastError;
}