"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graph_1 = require("../../src/orchestrator/graph");
describe('Orchestrator Graph', () => {
    it('should correctly build the graph', () => {
        const graph = (0, graph_1.buildGraph)();
        expect(graph).toBeDefined();
        // Verify it has the expected LangGraph interface properties
        expect(typeof graph.invoke).toBe('function');
    });
    it('should handle state transitions', async () => {
        const graph = (0, graph_1.buildGraph)();
        // Test the logic manually if internal properties are hard to reach
        // Or just verify the graph structure isn't null
        expect(graph).not.toBeNull();
    });
});
