import { HumanMessage } from "@langchain/core/messages";
import { ReviewState, LineComment } from "./manager";
import { reviewLLM } from "../ai/llm";
import { invokeWithRetry } from "../ai/utils";

// BUG 11: Max chars of diff sent to the LLM. Gemini Flash degrades silently
// on very large inputs — findings become generic and miss real issues.
const MAX_DIFF_CHARS = 12000;

export const securityAuditorNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("[SECURITY] Analyzing PR for vulnerabilities...");

  // BUG 11 FIX: Truncate diff with a visible marker so the LLM knows it is partial.
  const diff = state.prDiff.length > MAX_DIFF_CHARS
    ? state.prDiff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncated for context window...]"
    : state.prDiff;

  // BUG 2 FIX: Removed "Assistant:" prefix — it was injected into the user
  // message and confused the model's understanding of its own role.
  const prompt = `You are a Senior Security Engineer. Scan this PR diff for vulnerabilities.
IMPORTANT: For every HIGH severity finding, you MUST provide a "pocTestCode" property.
This code will be executed in a sandbox to verify the vulnerability.

DIFF:
${diff}

Respond ONLY with a JSON object wrapped in <json> and </json> tags:
<json>
{
  "findings": [
    {
      "severity": "HIGH" | "MEDIUM",
      "issue": "Brief description of vulnerability",
      "description": "Detailed explanation and remediation steps",
      "line": number,
      "path": "filename",
      "pocTestCode": "MANDATORY FOR HIGH: self-contained runnable JS script. Include all requires. Use relative path '../src/filename' to target the file. The script should print a clear error or exit with code 1 if the vulnerability is present (e.g. print 'EXPLOIT SUCCESS')."
    }
  ]
}
</json>

If the code is secure, return {"findings": []} wrapped in <json> tags.
Do not include any text outside the tags.`;


  try {
    const response = await invokeWithRetry(reviewLLM, [new HumanMessage(prompt)]);
    const content = response.content?.toString() || "";

    if (!content) {
      throw new Error("Empty response from AI (potentially blocked by safety filters)");
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
        const scriptName = f.pocTestCode ? `security_exploit_${f.line}.js` : null;

        // BUG 5 FIX: When a PoC test script is queued, write a [QUEUED:scriptName]
        // placeholder into the finding string. The sandbox node matches on this
        // exact token to splice the result back in. Previously auditors pushed
        // testScripts but NEVER wrote any placeholder — so findingIndex was always
        // -1 and every sandbox result was appended as an orphan duplicate finding.
        const verificationLine = scriptName
          ? `\n**Verification Status:** [QUEUED:${scriptName}]`
          : "";

        findings.push(
          `### [SECURITY] [${f.severity}] ${f.issue}\n${f.description}${verificationLine}`
        );

        inlineComments.push({
          path: f.path,
          line: f.line,
          body: `🛑 **[SECURITY] [${f.severity}]**\n\n${f.description}`,
        });

        if (scriptName && f.pocTestCode) {
          testScripts.push({ name: scriptName, content: f.pocTestCode });
        }
      });
    }

    return { findings, inlineComments, testScripts, auditorsCompleted: ["Security"] };
  } catch (e: any) {
    console.error(`[SECURITY] Parsing error: ${e.message}`);
    return {
      findings: [`### [SECURITY] [HIGH] Auditor Error\nThe Security auditor encountered an internal error: ${e.message}`],
      auditorsCompleted: ["Security"],
    };
  }
};
