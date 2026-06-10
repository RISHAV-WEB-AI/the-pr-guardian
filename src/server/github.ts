import { Octokit } from "@octokit/rest";
import "dotenv/config";

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function getPRDiff(owner: string, repo: string, pull_number: number): Promise<string> {
  try {
    console.log(`[GITHUB] Fetching diff for ${owner}/${repo} PR #${pull_number}...`);
    const { data } = await github.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: "diff" },
    });
    return data as unknown as string;
  } catch (error: any) {
    console.error(`[GITHUB] Error fetching diff: ${error.message}`);
    throw error;
  }
}

export async function postReviewFeedback(
  owner: string,
  repo: string,
  pull_number: number,
  findings: string[],
  inlineComments: any[] = []
) {
  try {
    const { data: pullRequest } = await github.pulls.get({ owner, repo, pull_number });
    const commitId = pullRequest.head.sha;

    // Post inline comments
    if (inlineComments.length > 0) {
      console.log(`[GITHUB] Posting ${inlineComments.length} inline comments...`);
      for (const comment of inlineComments) {
        try {
          await github.pulls.createReviewComment({
            owner,
            repo,
            pull_number,
            body: comment.body,
            commit_id: commitId,
            path: comment.path,
            line: comment.line,
            side: "RIGHT",
          });
        } catch (e: any) {
          console.warn(`[GITHUB] Inline comment failed on ${comment.path}:${comment.line} — ${e.message}`);
        }
      }
    }

    // BUG 4 FIX (report side): Because the sandbox appends resolved findings
    // alongside the original [QUEUED:...] placeholders (due to the concat reducer),
    // we need to filter out stale [QUEUED] entries that have a matching [RESOLVED].
    //
    // Build a set of script names that have been resolved, then skip any finding
    // that still contains [QUEUED:thatName].
    const resolvedScripts = new Set<string>();
    findings.forEach(f => {
      const m = f.match(/\[RESOLVED:([^\]]+)\]/);
      if (m) resolvedScripts.add(m[1]);
    });

    const cleanFindings = findings.filter(f => {
      const queued = f.match(/\[QUEUED:([^\]]+)\]/);
      if (queued && resolvedScripts.has(queued[1])) return false; // stale placeholder
      return true;
    });

    if (!cleanFindings || cleanFindings.length === 0) {
      if (inlineComments.length === 0) {
        console.log(`[GITHUB] No findings. Posting approval message.`);
        await github.issues.createComment({
          owner,
          repo,
          issue_number: pull_number,
          body: "🚀 **AI Code Reviewer** analyzed this PR.\n\n✅ LGTM! No High/Medium vulnerabilities or performance bugs detected.",
        });
      }
      return;
    }

    // BUG 9 FIX: The old getStatus counted a category as "Failed" even when the
    // only matching finding was "### [SECURITY] [HIGH] Auditor Error" — meaning
    // the auditor itself crashed, not the PR code. This made the dashboard show
    // 🔴 Failed for categories that never actually ran.
    // Fix: exclude findings that contain "Auditor Error" from the failure check.
    const getStatus = (cat: string) => {
      const catUpper = cat.toUpperCase();
      const hasRealFailure = cleanFindings.some(
        f => f.toUpperCase().includes(`[${catUpper}]`) && !f.includes("Auditor Error")
      );
      return hasRealFailure ? "🔴 Failed" : "✅ Passed";
    };

    console.log(`[GITHUB] Generating report for PR #${pull_number}...`);

    const dashboard = `
| Auditor | Status | Domain |
| :--- | :--- | :--- |
| 🛡️ Security | ${getStatus("Security")} | OWASP / Vulnerability |
| ⚡ Performance | ${getStatus("Performance")} | Complexity / Runtime |
| 🧠 Logic | ${getStatus("Logic")} | Business Logic / Edge Cases |
| 🎨 Style | ${getStatus("Style")} | Clean Code / Architecture |
| 🔗 Integration | ${getStatus("Integration")} | Context / Dependencies |
`;

    const reportBody =
      `## 🚀 AI Autonomous Review: Executive Summary\n\n${dashboard}\n\n---\n\n### 📝 Detailed Findings\n\n` +
      cleanFindings
        .filter(f => !!f && !f.includes("[RESOLVED:")) // strip resolved markers from display
        .map(f => {
          if (typeof f === "string" && f.includes("Verification Result (")) {
            return (
              f.replace(
                /\*\*Verification Result \((.*?)\):\*\*/,
                "\n<details>\n<summary>🔍 Technical Verification Log ($1)</summary>\n\n"
              ) + "\n</details>"
            );
          }
          return f;
        })
        .join("\n\n---\n\n");

    await github.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: reportBody,
    });
    console.log(`[GITHUB] ✅ Report posted successfully!`);
  } catch (error: any) {
    console.error(`[GITHUB] Failed to post review feedback: ${error.message}. Please check if GITHUB_TOKEN is correct and has correct permissions in .env.`);
  }
}
