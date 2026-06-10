import { HumanMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { reviewLLM } from "../ai/llm";
import { invokeWithRetry } from "../ai/utils";
import { getRepoConfig } from "../server/config";

export interface LineComment {
  path: string;
  line: number;
  body: string;
}

export interface ReviewState {
  owner: string;
  repo: string;
  pullNumber: number;
  baseBranch: string;
  prDiff: string;
  prDescription: string;
  contextFiles: string[];
  domains: string[];
  findings: string[];
  inlineComments: LineComment[];
  auditorsCompleted: string[];
  loopCount: number;
  lastSandboxLogs?: string;
  testScripts: Array<{ name: string; content: string }>;
  fixedFiles: Array<{ path: string; content: string }>;
}

export const StateAnnotation = Annotation.Root({
  owner: Annotation<string>,
  repo: Annotation<string>,
  pullNumber: Annotation<number>,
  baseBranch: Annotation<string>,
  prDiff: Annotation<string>,
  prDescription: Annotation<string>,
  contextFiles: Annotation<string[]>,
  domains: Annotation<string[]>,
  findings: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
  inlineComments: Annotation<LineComment[]>({
    reducer: (x, y) => x.concat(y),
  }),
  auditorsCompleted: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
  // BUG 12 FIX: The old reducer was (x, y) => (y || 0).
  // When any auditor node returns without a loopCount key, y is undefined,
  // so the reducer returned 0 — resetting the counter on every parallel node
  // completion. The fixer's >= 3 guard could never trigger.
  // Fix: only update when y is explicitly a number.
  loopCount: Annotation<number>({
    reducer: (x, y) => (typeof y === "number" ? y : x),
    default: () => 0,
  }),
  lastSandboxLogs: Annotation<string | undefined>({
    reducer: (x, y) => y,
  }),
  testScripts: Annotation<Array<{ name: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
  }),
  fixedFiles: Annotation<Array<{ path: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
  }),
});

export const managerNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("-----------------------------------------");
  console.log(`[MANAGER] Analyzing PR metadata for orchestration...`);

  // BUG 2 FIX: Removed "Assistant:" prefix from all prompts. This string was
  // being injected into the HumanMessage content, which caused the LLM to
  // receive a garbled role signal and hurt response accuracy across all auditors.
  // The role is set by the system/human message structure, not inline text.
  const prompt = `You are a Tech Lead. Categorize this PR into one or more of these domains:
Security, Performance, Logic, Style, Integration.

PR DESCRIPTION:
${state.prDescription}

DIFF OVERVIEW:
${state.prDiff.slice(0, 1500)}

Respond with ONLY a comma-separated list of domain names, nothing else. Example: Security, Logic`;

  try {
    const response = await invokeWithRetry(reviewLLM, [new HumanMessage(prompt)]);
    let domains = response.content
      .toString()
      .split(",")
      .map((d: string) => d.trim())
      .filter(Boolean);

    // Integrate .reviewer.yml config
    const config = await getRepoConfig(state.owner, state.repo);
    
    // Feature 4: Filter out disabled auditors
    if (config.disabledAuditors && config.disabledAuditors.length > 0) {
      domains = domains.filter((d: string) => !config.disabledAuditors?.includes(d));
    }

    // Feature 2: Trigger Test Writer if explicitly enabled in config
    if (config.autoTests) {
      domains.push("Test Writer");
    }

    console.log(`[MANAGER] Triage complete. Domains identified: ${domains.join(", ")}`);

    return {
      domains,
      loopCount: state.loopCount ?? 0,
    };
  } catch (e: any) {
    console.error(`[MANAGER] Error in triage: ${e.message}`);
    return { domains: ["Security", "Logic"] };
  }
};
