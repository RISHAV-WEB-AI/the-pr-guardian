import { HumanMessage } from "@langchain/core/messages";
import { ReviewState, LineComment } from "./manager";
import { getReviewLLM, getPremiumLLM } from "../ai/provider";
import { invokeWithRetry } from "../ai/utils";

const MAX_DIFF_CHARS = 12000;

export const performanceAuditorNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("[PERFORMANCE] Analyzing algorithmic runtime...");

  // BUG 11 FIX: Truncate large diffs to avoid silent context overflow.
  const diff = state.prDiff.length > MAX_DIFF_CHARS
    ? state.prDiff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncated for context window...]"
    : state.prDiff;

  // BUG 2 FIX: Removed "Assistant:" prefix from prompt.
  const prompt = `You are a Performance Engineer. Analyze this PR diff for algorithmic inefficiencies, excessive memory usage, or blocking I/O calls.
IMPORTANT: For every HIGH severity finding, you MUST provide a "perfTestCode" property.
This code will be executed in a sandbox to verify the performance issue.

DIFF:
${diff}

Respond ONLY with a JSON object wrapped in <json> and </json> tags:
<json>
{
  "findings": [
    {
      "severity": "MEDIUM" | "HIGH",
      "line": number,
      "path": "filename",
      "issue": "Performance Bottleneck",
      "description": "Explanation of complexity and suggested fix",
      "perfTestCode": "MANDATORY FOR HIGH: self-contained runnable JS benchmark script. Include all requires. Use relative path '../src/filename' to target the file. The script should demonstrate the slowness or blocking nature (e.g. measure time or use a timeout)."
    }
  ]
}
</json>

If performance is optimal, return {"findings": []} wrapped in <json> tags.
Do not include any text outside the tags.`;

  try {
    const response = await invokeWithRetry(getReviewLLM(state.geminiApiKey), [new HumanMessage(prompt)]);
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
    const testScripts: Array<{ name: string; content: string }> = [];

    if (parsed.findings && Array.isArray(parsed.findings)) {
      parsed.findings.forEach((f: any) => {
        const scriptName = f.perfTestCode ? `perf_bench_${f.line}.js` : null;

        // BUG 5 FIX: Write [QUEUED:scriptName] placeholder so sandbox can
        // locate and patch this finding after test execution.
        const verificationLine = scriptName
          ? `\n**Verification Status:** [QUEUED:${scriptName}]`
          : "";

        findings.push(
          `### [PERFORMANCE] [${f.severity}] ${f.issue}\n${f.description}${verificationLine}`
        );

        inlineComments.push({
          path: f.path,
          line: f.line,
          body: `🚀 **[PERFORMANCE] [${f.severity}]**\n\n${f.description}`,
        });

        if (scriptName && f.perfTestCode) {
          testScripts.push({ name: scriptName, content: f.perfTestCode });
        }
      });
    }

    return { findings, inlineComments, testScripts, auditorsCompleted: ["Performance"] };
  } catch (e: any) {
    console.error(`[PERFORMANCE] Error: ${e.message}`);
    return {
      findings: [`### [PERFORMANCE] [HIGH] Auditor Error\nThe Performance auditor encountered an internal error: ${e.message}`],
      auditorsCompleted: ["Performance"],
    };
  }
};
