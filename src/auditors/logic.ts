import { HumanMessage } from "@langchain/core/messages";
import { ReviewState, LineComment } from "./manager";
import { premiumLLM } from "../ai/provider";
import { invokeWithRetry } from "../ai/utils";

const MAX_DIFF_CHARS = 12000;

export const logicAuditorNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("[LOGIC] Analyzing business logic and edge cases...");

  // BUG 11 FIX: Truncate large diffs.
  const diff = state.prDiff.length > MAX_DIFF_CHARS
    ? state.prDiff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncated for context window...]"
    : state.prDiff;

  // BUG 2 FIX: Removed "Assistant:" prefix from prompt.
  const prompt = `You are a Senior Logic & Edge-Case Specialist. Review this PR diff for business logic flaws, off-by-one errors, race conditions, or unhandled states.

DIFF:
${diff}

Respond ONLY with a JSON object wrapped in <json> and </json> tags:
<json>
{
  "findings": [
    {
      "severity": "HIGH" | "MEDIUM",
      "line": number,
      "path": "filename",
      "issue": "Brief summary",
      "description": "Why this is a bug and how to fix it"
    }
  ]
}
</json>

If the logic is sound, return {"findings": []} wrapped in <json> tags.
Do not include any text outside the tags.`;

  try {
    const response = await invokeWithRetry(premiumLLM, [new HumanMessage(prompt)]);
    const content = response.content?.toString() || "";

    if (!content) {
      throw new Error("Empty response from AI (blocked or malformed)");
    }

    let parsedContent = content;
    const jsonMatch = content.match(/<json>([\s\S]*?)<\/json>/);
    if (jsonMatch) {
      parsedContent = jsonMatch[1].trim();
    } else {
      parsedContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    const parsed = JSON.parse(parsedContent);
    const findings: string[] = [];
    const inlineComments: LineComment[] = [];

    if (parsed.findings && Array.isArray(parsed.findings)) {
      parsed.findings.forEach((f: any) => {
        findings.push(`### [LOGIC] [${f.severity}] ${f.issue}\n${f.description}`);
        inlineComments.push({
          path: f.path,
          line: f.line,
          body: `🔍 **[LOGIC] [${f.severity}]**\n\n${f.description}`,
        });
      });
    }

    return { findings, inlineComments, auditorsCompleted: ["Logic"] };
  } catch (e: any) {
    console.error(`[LOGIC] Error: ${e.message}`);
    return {
      findings: [`### [LOGIC] [HIGH] Auditor Error\nThe Logic auditor encountered an internal error: ${e.message}`],
      auditorsCompleted: ["Logic"],
    };
  }
};
