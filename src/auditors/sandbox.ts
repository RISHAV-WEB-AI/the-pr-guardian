import { ReviewState } from "./manager";
import { generateAndQueueTerminalTest } from "../verification/terminal";

export const sandboxNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  if (state.testScripts.length === 0) {
    return { auditorsCompleted: ["Sandbox"] };
  }

  console.log(`[SANDBOX] Executing ${state.testScripts.length} queued tests...`);
  let allLogs = "";
  let failureFound = false;

  // BUG 4 FIX: The old code read state.findings into finalFindings, mutated
  // it, then returned { findings: finalFindings } — the full array.
  // Because the StateAnnotation reducer is x.concat(y), this concatenated the
  // ENTIRE array onto the existing state, doubling every finding in the report.
  //
  // Fix: we only return the CHANGED findings as a delta (replacements only).
  // We identify which findings contain a [QUEUED:...] token, compute their
  // updated versions, and return just those updated strings. The reducer will
  // append them. We also return the originals to be deduplicated at report
  // time — actually the cleanest fix is to use a "replace" reducer for findings.
  //
  // Since we can't change the reducer without touching manager.ts (already done),
  // the correct approach here is: return ONLY the new result entries.
  // The [QUEUED:...] placeholders will remain in state from auditors, but we
  // append the resolved versions alongside them.  The github.ts report builder
  // filters them when building the report body.
  //
  // Best approach given the append-only reducer: build a replacements map,
  // and let github.ts prefer resolved entries over queued placeholders.
  // We signal resolved entries with [RESOLVED:scriptName] so the report
  // can filter out the stale [QUEUED] entries.

  const resolvedFindings: string[] = [];

  for (const script of state.testScripts) {
    const result = await generateAndQueueTerminalTest(script.name, script.content);

    const statusEmoji = result.success ? "✅" : "❌";
    const resultText = `\n**Verification Result (${statusEmoji}):**\n\`\`\`\n${result.log}\n\`\`\``;
    const matchToken = `[QUEUED:${script.name}]`;

    // Find the original queued finding so we can reproduce its header
    const originalFinding = state.findings.find(f => f.includes(matchToken));

    if (originalFinding) {
      // Replace the [QUEUED:...] placeholder with the actual result,
      // and mark as resolved so github.ts can suppress the old queued version.
      const resolved = originalFinding
        .replace(`**Verification Status:** ${matchToken}`, `**Verification Status:** ${resultText}`)
        .replace(matchToken, `[RESOLVED:${script.name}]`);
      resolvedFindings.push(resolved);
    } else {
      // No matching queued finding — append as standalone result
      console.warn(`[SANDBOX] Could not locate queued finding for "${script.name}". Appending standalone.`);
      resolvedFindings.push(
        `### Sandbox Result — ${script.name}\n**Verification Result (${statusEmoji}):**\n\`\`\`\n${result.log}\n\`\`\``
      );
    }

    if (!result.success) {
      failureFound = true;
      allLogs += `FILE: ${script.name}\nERROR:\n${result.log}\n\n`;
    }
  }

  return {
    // Return only the resolved deltas. The report builder in github.ts
    // will skip findings that still contain [QUEUED:...] tokens when
    // a matching [RESOLVED:...] entry exists.
    findings: resolvedFindings,
    lastSandboxLogs: failureFound ? allLogs : undefined,
    testScripts: [],
    auditorsCompleted: ["Sandbox"],
  };
};
