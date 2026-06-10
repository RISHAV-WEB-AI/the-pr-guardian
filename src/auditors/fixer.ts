import { HumanMessage } from "@langchain/core/messages";
import { ReviewState } from "./manager";
import { getReviewLLM, getPremiumLLM } from "../ai/provider";
import { invokeWithRetry } from "../ai/utils";

export const fixerAuditorNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  if (!state.lastSandboxLogs || state.loopCount >= 3) {
    return { auditorsCompleted: ["Fixer"] };
  }

  console.log(`[FIXER] 🛠️ Synthesizing autonomous fix (Iteration ${state.loopCount + 1})...`);

  const prompt = `You are a Self-Healing AI Engineer.
A code validation test FAILED in the sandbox. You must fix the code.

ERROR LOGS:
${state.lastSandboxLogs}

ORIGINAL DIFF:
${state.prDiff}

INSTRUCTIONS:
1. Fix the bug identified in the logs.
2. Return ONLY a JSON array of objects wrapped in <json> and </json> tags.
3. Format:
   <json>
   [{ "path": "filename", "content": "FULL_FILE_CONTENT_AFTER_FIX" }]
   </json>
4. Ensure the content is the COMPLETE file, not just a diff.
5. Do not include any text outside the tags.`;

  try {
    const response = await invokeWithRetry(getPremiumLLM(state.geminiApiKey), [new HumanMessage(prompt)]);
    const content = response.content?.toString() || "";

    if (!content) {
      throw new Error("Empty response from AI (blocked or malformed)");
    }

    let parsedContent = content;
    const jsonMatch = content.match(/<json>([\s\S]*?)<\/json>/);
    if (jsonMatch) {
      parsedContent = jsonMatch[1].trim();
    } else {
      parsedContent = content.replace(/```json|```/g, "").trim();
    }

    const fixedFiles = JSON.parse(parsedContent);

    return {
      fixedFiles,
      loopCount: state.loopCount + 1,
      lastSandboxLogs: undefined,
      auditorsCompleted: ["Fixer"],
    };
  } catch (e: any) {
    console.error(`[FIXER] Failed to generate valid fix: ${e.message}`);
    // BUG 5 (from previous session): Always return auditorsCompleted on error
    // path to avoid stalling the LangGraph state machine router.
    return {
      findings: [`### [FIXER] [HIGH] Parsing Error\nFailed to parse Fixer output: ${e.message}`],
      loopCount: state.loopCount + 1,
      auditorsCompleted: ["Fixer"],
    };
  }
};
