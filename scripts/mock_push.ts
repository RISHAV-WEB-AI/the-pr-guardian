import axios from 'axios';

const MOCK_PAYLOAD = {
  ref: "refs/heads/main",
  repository: {
    name: "project-ai-code-reviewer",
    owner: { login: "test-user" }
  }
};

async function triggerMockPush() {
  console.log("🚀 Triggering Mock PUSH event...");
  try {
    const response = await axios.post('http://localhost:3000/webhook/github', MOCK_PAYLOAD, {
      headers: {
        'x-github-event': 'push',
        'Content-Type': 'application/json'
      }
    });
    console.log("✅ Server accepted event:", response.data);
  } catch (error: any) {
    console.error("❌ Failed to trigger mock push:", error.response?.data || error.message);
  }
}

triggerMockPush();
