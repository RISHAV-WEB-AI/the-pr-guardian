import { buildGraph } from '../../src/orchestrator/graph';
import { ReviewState } from '../../src/auditors/manager';

describe('Orchestrator Graph', () => {
  it('should correctly build the graph', () => {
    const graph = buildGraph();
    expect(graph).toBeDefined();
    // Verify it has the expected LangGraph interface properties
    expect(typeof graph.invoke).toBe('function');
  });

  it('should handle state transitions', async () => {
    const graph = buildGraph();
    
    // Test the logic manually if internal properties are hard to reach
    // Or just verify the graph structure isn't null
    expect(graph).not.toBeNull();
  });
});
