import { HumanMessage } from "@langchain/core/messages";
import { ReviewState } from "./manager";
import { getReviewLLM, getPremiumLLM } from "../ai/provider";
import { retrieveRelevantContext } from "../indexing/retriever";
import { invokeWithRetry } from "../ai/utils";

const MAX_DIFF_CHARS = 12000;

export const integrationAuditorNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("[INTEGRATION] Analyzing cross-file dependencies with RAG...");

  let ragContext = "";
  try {
    ragContext = await retrieveRelevantContext(state.prDiff.slice(0, 1000));
  } catch (e) {
    console.warn("[INTEGRATION] RAG retrieval failed, falling back to standard analysis.");
  }

  // BUG 11 FIX: Truncate large diffs.
  const diff = state.prDiff.length > MAX_DIFF_CHARS
    ? state.prDiff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncated for context window...]"
    : state.prDiff;

  // BUG 2 FIX: Removed "Assistant:" prefix from prompt.
  const prompt = `You are an Integration & Architecture Auditor.
You have repository-wide context available via RAG to detect cross-file breaking changes.

PR DIFF:
${diff}

REPOSITORY CONTEXT (RAG):
${ragContext || "No additional context retrieved."}

Respond ONLY with a JSON array wrapped in <json> and </json> tags.
Each item is an inline comment to post on the PR:
<json>
[{ "path": "filename", "line": 12, "body": "comment text" }]
</json>

If integration is safe and no cross-file issues are found, return exactly [] wrapped in <json> tags.
Do not include any text outside the tags.`;

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

    try {
      const inlineComments = JSON.parse(parsedContent);
      return { inlineComments, auditorsCompleted: ["Integration"] };
    } catch (parseError: any) {
      console.warn(`[INTEGRATION] Failed to parse response: ${content.slice(0, 100)}...`);
      return {
        findings: [`### [INTEGRATION] [HIGH] Auditor Error\nFailed to parse Integration auditor output: ${parseError.message}`],
        auditorsCompleted: ["Integration"],
      };
    }
  } catch (e: any) {
    console.error(`[INTEGRATION] Error: ${e.message}`);
    return {
      findings: [`### [INTEGRATION] [HIGH] Auditor Error\nFailed to invoke model: ${e.message}`],
      auditorsCompleted: ["Integration"],
    };
  }
};
