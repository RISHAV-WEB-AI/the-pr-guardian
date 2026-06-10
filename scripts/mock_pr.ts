import axios from 'axios';

const MOCK_PAYLOAD = {
  action: "opened",
  pull_request: {
    number: 42,
    title: "Critical Security Fix and Performance Optimization",
    body: "This PR introduces a user processing logic with potential vulnerabilities for testing.",
    base: { ref: "main" },
    head: { sha: "mock_sha_123" }
  },
  repository: {
    name: "project-ai-code-reviewer",
    owner: { login: "test-user" }
  }
};

async function triggerMockPR() {
  console.log("🚀 Triggering Mock PR event...");
  try {
    const response = await axios.post('http://localhost:3000/webhook/github', MOCK_PAYLOAD, {
      headers: {
        'x-github-event': 'pull_request',
        'Content-Type': 'application/json'
      }
    });
    console.log("✅ Server accepted event:", response.data);
    console.log("Check your server terminal for live logs and http://localhost:3000/dashboard for the UI update.");
  } catch (error: any) {
    console.error("❌ Failed to trigger mock PR:", error.response?.data || error.message);
  }
}

triggerMockPR();
