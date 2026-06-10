import { HumanMessage } from "@langchain/core/messages";
import { ReviewState, LineComment } from "./manager";
import { reviewLLM } from "../ai/provider";
import { invokeWithRetry } from "../ai/utils";

const MAX_DIFF_CHARS = 12000;

export const testWriterNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("[TEST_WRITER] Analyzing diff for missing unit tests...");

  const diff = state.prDiff.length > MAX_DIFF_CHARS
    ? state.prDiff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncated...]"
    : state.prDiff;

  const prompt = `You are an automated Test Engineer. Review this PR diff.
If new functions or logic have been added WITHOUT corresponding unit tests, you must write a complete, runnable test file using Jest/Vitest.

DIFF:
${diff}

Respond ONLY with a JSON object wrapped in <json> and </json> tags:
<json>
{
  "needsTests": boolean,
  "findings": [
    {
      "severity": "LOW",
      "issue": "Missing Unit Tests",
      "description": "Explanation of what needs testing"
    }
  ],
  "generatedTests": [
    {
      "path": "tests/new_file.test.ts",
      "content": "import { func } from '../src/file';\\n\\ndescribe('func', () => {\\n  it('works', () => {\\n    expect(func()).toBe(true);\\n  });\\n});"
    }
  ]
}
</json>

If no tests are needed, return {"needsTests": false} wrapped in <json> tags.
Do not include any text outside the tags.`;

  try {
    const response = await invokeWithRetry(reviewLLM, [new HumanMessage(prompt)]);
    const content = response.content?.toString() || "";

    if (!content) {
      throw new Error("Empty response from AI");
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
    const fixedFiles: Array<{ path: string; content: string }> = [];

    if (parsed.needsTests) {
      if (parsed.findings) {
        parsed.findings.forEach((f: any) => {
          findings.push(`### [TEST] [${f.severity}] ${f.issue}\n${f.description}`);
        });
      }
      if (parsed.generatedTests) {
        parsed.generatedTests.forEach((t: any) => {
          fixedFiles.push({ path: t.path, content: t.content });
          findings.push(`### [TEST] [AUTO-GENERATED] Created test file: \`${t.path}\``);
        });
      }
    }

    return { findings, fixedFiles, auditorsCompleted: ["Test Writer"] };
  } catch (e: any) {
    console.error(`[TEST_WRITER] Error: ${e.message}`);
    return {
      findings: [`### [TEST] [MEDIUM] Auditor Error\nThe Test Writer encountered an error: ${e.message}`],
      auditorsCompleted: ["Test Writer"],
    };
  }
};
