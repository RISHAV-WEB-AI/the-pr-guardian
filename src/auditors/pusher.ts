import { ReviewState } from "./manager";
import { deployAutonomousFix } from "../server/pusher";

export const pusherAuditorNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
    // Only deploy if we actually have fixed files and we've gone through at least one loop
    if (state.fixedFiles.length === 0 || state.loopCount === 0) {
        return { auditorsCompleted: ["Pusher"] };
    }

    console.log(`[PUSHER NODE] 🚀 Deploying ${state.fixedFiles.length} verified fixes via GitHub API...`);

    try {
        const prUrl = await deployAutonomousFix({
            owner: state.owner,
            repo: state.repo,
            pull_number: state.pullNumber,
            baseBranch: state.baseBranch,
            fixedFiles: state.fixedFiles
        });

        const finding = `### 🤖 [AI AUTOPILOT] Autonomous Fix Deployed\n\n**The AI and Sandbox have successfully verified a patch for the identified vulnerabilities.**\n\n🔗 **View Fix Pull Request:** ${prUrl}\n\n_Review the stacked PR and merge to apply the fix safely._`;
        
        return { 
            findings: [finding],
            auditorsCompleted: ["Pusher"] 
        };
    } catch (e: any) {
        console.error(`[PUSHER NODE] Failed to deploy autonomous fix: ${e.message}`);
        return { auditorsCompleted: ["Pusher"] };
    }
};
