import { Octokit } from "@octokit/rest";
import yaml from "js-yaml";
import "dotenv/config";

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface ReviewerConfig {
  autoTests?: boolean;
  ignoreFiles?: string[];
  disabledAuditors?: string[];
  strictMode?: boolean;
}

export async function getRepoConfig(owner: string, repo: string): Promise<ReviewerConfig> {
  try {
    console.log(`[CONFIG] Checking for .reviewer.yml in ${owner}/${repo}...`);
    
    const { data }: any = await github.repos.getContent({
      owner,
      repo,
      path: ".reviewer.yml",
    });

    if (data && data.content) {
      const content = Buffer.from(data.content, "base64").toString("utf8");
      const config = yaml.load(content) as ReviewerConfig;
      console.log(`[CONFIG] Found .reviewer.yml. AutoTests: ${config.autoTests}`);
      return config;
    }
  } catch (e: any) {
    if (e.status !== 404) {
      console.warn(`[CONFIG] Error fetching .reviewer.yml: ${e.message}`);
    } else {
      console.log(`[CONFIG] No .reviewer.yml found. Using default settings.`);
    }
  }

  return {
    autoTests: false, // Default is OFF as per user request
    ignoreFiles: [],
    disabledAuditors: [],
  };
}
