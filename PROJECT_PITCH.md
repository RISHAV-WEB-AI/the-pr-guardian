# 🚀 Autonomous AI Engineering Suite: The PR Guardian

## 🎯 Project Tagline
**"An Agentic AI Orchestrator that doesn't just review code—it verifies it."**

---

## ⚡ The Problem: The Modern Code Review Bottleneck
In fast-moving engineering teams, the code review process is the single biggest point of friction:
1.  **Human Latency**: Developers wait hours or days for a senior engineer's feedback.
2.  **Surface-Level Reviews**: Humans often miss deep logic errors or performance bottlenecks (O(n^2) loops) during quick scans.
3.  **Invisible Security Flaws**: SQL Injection or insecure API usage often slips through standard linters.
4.  **"It looks good on paper"**: Standard AI (like Copilot) can suggest code that *looks* right but fails in execution.

---

## 🛠️ What I Built: A Multi-Agent Autonomous Auditor
I engineered an end-to-end **Autonomous Code Review Pipeline** that acts as a 24/7 Senior Engineering team. Unlike basic AI assistants, this system is **Agentic**—it orchestrates multiple specialized AI "Auditors" through a directed graph to reach a consensus on code quality.

### **Core Capabilities**
*   **Sequential Intelligence**: A LangGraph-powered state machine that triages and routes PRs through 5 specialized security and logic gates.
*   **Empirical Verification (The Sandbox)**: The system doesn't just guess. It generates real JavaScript test scripts, executes them in a temporary terminal sandbox, and reports the actual runtime/security results.
*   **Premium Executive Dashboard**: Generates a high-end, color-coded status report directly on GitHub PRs, providing an instant bird's-eye view for managers.

---

## 🏗️ How I Built It: The Architecture

### **1. The Orchestration Layer (LangGraph)**
The heart of the project is a **StateGraph** built with `@langchain/langgraph`. 
- **Manager Agent**: Analyzes the PR description and decides which auditors to trigger.
- **Specialized Auditors**: A chain of nodes including **Security**, **Performance**, **Logic**, **Style**, and **Integration**.
- **Edge Logic**: Controls the flow of state, ensuring that findings from one agent are passed as context to the next.

### **2. The Webhook Reactor (Express & Ngrok)**
- Implemented a secure listener for GitHub `pull_request` events.
- Used **Ngrok** to create a secure tunnel for live local development.
- Handled various PR actions (`opened`, `synchronize`, `review_requested`) to ensure the AI responds instantly to developer activity.

### **3. The Validation Engine (Terminal Agent)**
- Built a custom "Verification Service" that prompts the LLM to write PoC (Proof-of-Concept) scripts.
- The system executes these scripts locally to verify findings (like measuring the time complexity of a loop).

---

## 🛠️ The Tech Stack
*   **Core**: TypeScript (Node.js)
*   **AI Engine**: Google Gemini 1.5 Pro / Flash
*   **Orchestration**: LangChain / LangGraph (State Machine Architecture)
*   **API / Integration**: Octokit (@octokit/rest) for GitHub API interaction.
*   **Contextual Tools**: Stitch MCP (Model Context Protocol) for UI/UX design alignment.
*   **Networking**: Express, Ngrok, and Dotenv.

---

## 🔄 The Workflow (How it Works)
1.  **Trigger**: A developer pushes code to a GitHub Pull Request.
2.  **Ingestion**: A Webhook triggers my server, which fetches the raw code diff using Octokit.
3.  **Triage**: The **Manager node** identifies if the change is frontend, backend, or architectural.
4.  **Scan**: The PR diff travels through the **Auditor Chain**.
    - *Example*: Security detects a potential SQLi -> Terminal Agent writes a PoC -> PoC is executed -> Results are recorded.
5.  **Report**: The orchestrator assembles a **Markdown Executive Summary** with a status table and posts it as a PR comment.

---

## 📈 Impact & Differentiation
- **Proactive vs. Reactive**: While GitHub Copilot helps write code, my project **guards** it.
- **High-Fidelity Feedback**: By using a terminal sandbox, I reduced "hallucinations" by providing actual execution logs.
- **Enterprise Grade**: Designed with a "Moat" focused on security-critical and regulated industries.

---

## 🔮 Future Roadmap: The "Autonomous Teammate"
- **Self-Healing PRs**: Integrating a "Fixer Node" that creates new commits to automatically patch the bugs it finds.
- **RAG Architecture**: Indexing the entire codebase in a Vector Database to provide repo-wide context.
- **Persistent Fleet Dashboard**: A React-based web UI for engineering managers to track repository health across an entire organization.
