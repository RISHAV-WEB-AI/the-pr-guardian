import axios from "axios";

async function simulateWebhook() {
    const payload = {
        action: "opened",
        repository: {
            name: "project-ai-code-reviewer",
            owner: { login: "user" }
        },
        pull_request: {
            number: 1,
            title: "Simulated PR for Live Stats",
            body: "Testing the dashboard and terminal output reporting.",
            base: { ref: "main" }
        }
    };

    console.log("🚀 Sending simulated PR webhook to http://localhost:3000/webhook/github...");
    try {
        const response = await axios.post("http://localhost:3000/webhook/github", payload, {
            headers: {
                "x-github-event": "pull_request",
                "Content-Type": "application/json"
            }
        });
        console.log("✅ Webhook accepted:", response.status, response.data);
        console.log("Check the server terminal for live logs and the dashboard for live stats!");
    } catch (error: any) {
        console.error("❌ Failed to send webhook:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

simulateWebhook();