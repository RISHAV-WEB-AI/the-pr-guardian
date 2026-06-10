import axios from "axios";

/**
 * This script simulates a GitHub Webhook event for a Pull Request.
 * It sends a POST request to your local server's webhook endpoint.
 */
const testWebhook = async () => {
  const url = "http://localhost:3000/webhook/github";
  
  const payload = {
    action: "opened",
    repository: {
      name: "test-repo",
      owner: { login: "test-user" }
    },
    pull_request: {
      number: 42,
      title: "Fix potential security leak",
      body: "I've optimized the SQL queries and added some validation logic.",
      base: { ref: "main" },
      head: { sha: "abc1234567890" }
    }
  };

  console.log("🚀 Sending mock GitHub PR Webhook...");

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "x-github-event": "pull_request",
        "Content-Type": "application/json"
      }
    });

    console.log(`✅ Server responded with status: ${response.status}`);
    console.log(`📄 Response: ${response.data}`);
    console.log("\nCheck your server terminal to see the AI Reviewer in action!");
  } catch (error: any) {
    console.error("❌ Failed to send webhook:", error.message);
    if (error.response) {
      console.error("Response Data:", error.response.data);
    }
  }
};

testWebhook();
