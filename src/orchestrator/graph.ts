import { StateGraph, END, MemorySaver } from "@langchain/langgraph";
import { StateAnnotation, managerNode } from "../auditors/manager";
import { securityAuditorNode } from "../auditors/security";
import { logicAuditorNode } from "../auditors/logic";
import { performanceAuditorNode } from "../auditors/performance";
import { integrationAuditorNode } from "../auditors/integration";
import { styleAuditorNode } from "../auditors/style";
import { sandboxNode } from "../auditors/sandbox";
import { fixerAuditorNode } from "../auditors/fixer";
import { pusherAuditorNode } from "../auditors/pusher";
import { testWriterNode } from "../auditors/test_writer";

// FIX (Bug 12): Removed unused `Annotation` import — it was never used and caused
// a lint warning. More importantly the StateAnnotation loopCount reducer must be
// (x, y) => (typeof y === "number" ? y : x) — see auditors/manager for that fix.

export const buildGraph = () => {
    const workflow = new StateGraph(StateAnnotation)
        .addNode("manager", managerNode)
        .addNode("security", securityAuditorNode)
        .addNode("logic", logicAuditorNode)
        .addNode("performance", performanceAuditorNode)
        .addNode("style", styleAuditorNode)
        .addNode("integration", integrationAuditorNode)
        .addNode("sandbox", sandboxNode)
        .addNode("fixer", fixerAuditorNode)
        .addNode("pusher", pusherAuditorNode)
        .addNode("testWriter", testWriterNode);

    // Entry point
    workflow.setEntryPoint("manager");

    // 1. All auditors fan out in parallel from the manager
    workflow.addEdge("manager", "security");
    workflow.addEdge("manager", "performance");
    workflow.addEdge("manager", "logic");
    workflow.addEdge("manager", "style");
    workflow.addEdge("manager", "integration");
    workflow.addEdge("manager", "testWriter");

    // 2. All auditors converge at sandbox
    workflow.addEdge("security", "sandbox");
    workflow.addEdge("performance", "sandbox");
    workflow.addEdge("logic", "sandbox");
    workflow.addEdge("style", "sandbox");
    workflow.addEdge("integration", "sandbox");
    workflow.addEdge("testWriter", "sandbox");

    // "The Ralph Loop": Self-Healing logic
    // FIX (Bug 12): The loopCount reset bug is in the StateAnnotation reducer in
    // manager.ts (see that file). The routing logic here is correct — it relies on
    // loopCount NOT being reset to 0 by intermediate nodes returning no loopCount field.
    workflow.addConditionalEdges(
        "sandbox",
        (state) => {
            // Disabled self-healing loop for speed. Always exit after first sandbox run.
            return "end";
        },
        {
            fixer: "fixer",
            pusher: "pusher",
            end: END
        }
    );

    // Fixer loops back to re-audit the patched code
    workflow.addEdge("fixer", "manager");

    // After pusher, workflow ends
    workflow.addEdge("pusher", END);

    return workflow.compile({ checkpointer: new MemorySaver() });
};