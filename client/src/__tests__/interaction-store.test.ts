import { describe, it, expect, beforeEach } from "vitest";
import { useInteractionStore } from "@/entities/interaction-store";
import type { GraphData, GraphNode, GraphEdge } from "@/shared/api/types";

const fixtureGraph: GraphData = {
  nodes: [
    {
      id: "a", label: "A", kind: "file", filePath: "a.ts", isPublic: true,
      metrics: { lines: 0, methodCount: 0, dependencyCount: 0, inheritanceDepth: 0 },
      reExports: [],
    },
    {
      id: "b", label: "B", kind: "file", filePath: "b.ts", isPublic: true,
      metrics: { lines: 0, methodCount: 0, dependencyCount: 0, inheritanceDepth: 0 },
      reExports: [],
    },
  ] as GraphNode[],
  edges: [
    { id: "e1", sourceId: "a", targetId: "b", kind: "import", isAccessible: true },
  ] as GraphEdge[],
  projectRoot: "/test",
};

beforeEach(() => {
  useInteractionStore.getState().reset();
  try { localStorage.removeItem("codevisualizer-theme"); } catch {}
});

describe("useInteractionStore", () => {
  it("initializes with default state", () => {
    const state = useInteractionStore.getState();
    expect(state.graphData).toBeNull();
    expect(state.selectedNodeId).toBeNull();
    expect(state.traceSourceId).toBeNull();
    expect(state.tracePath).toBeNull();
    expect(state.viewMode).toBe("3d");
    expect(state.layoutMode).toBe("spherical");
    expect(state.theme).toBe("dark");
  });

  it("selects a node", () => {
    useInteractionStore.getState().selectNode("a");
    expect(useInteractionStore.getState().selectedNodeId).toBe("a");
  });

  it("clears selection", () => {
    useInteractionStore.getState().selectNode("a");
    useInteractionStore.getState().selectNode(null);
    expect(useInteractionStore.getState().selectedNodeId).toBeNull();
  });

  it("sets graph data", () => {
    useInteractionStore.getState().setGraphData(fixtureGraph);
    expect(useInteractionStore.getState().graphData).toEqual(fixtureGraph);
  });

  it("sets view mode", () => {
    useInteractionStore.getState().setViewMode("2d");
    expect(useInteractionStore.getState().viewMode).toBe("2d");
  });

  it("sets layout mode", () => {
    useInteractionStore.getState().setLayoutMode("concentric");
    expect(useInteractionStore.getState().layoutMode).toBe("concentric");
  });

  it("toggles theme", () => {
    useInteractionStore.getState().toggleTheme();
    expect(useInteractionStore.getState().theme).toBe("light");
    useInteractionStore.getState().toggleTheme();
    expect(useInteractionStore.getState().theme).toBe("dark");
  });

  it("registers zoomToNode callback", () => {
    const fn = () => true;
    useInteractionStore.getState().registerZoomToNode(fn);
    expect(useInteractionStore.getState().zoomToNode).toBe(fn);
    useInteractionStore.getState().registerZoomToNode(null);
    expect(useInteractionStore.getState().zoomToNode).toBeNull();
  });

  it("manages trace state - start and cancel", () => {
    useInteractionStore.getState().setGraphData(fixtureGraph);
    useInteractionStore.getState().toggleTraceSource("a");
    expect(useInteractionStore.getState().traceSourceId).toBe("a");
    // Click same node again to cancel
    useInteractionStore.getState().toggleTraceSource("a");
    expect(useInteractionStore.getState().traceSourceId).toBeNull();
  });

  it("resets state but preserves theme", () => {
    useInteractionStore.getState().setGraphData(fixtureGraph);
    useInteractionStore.getState().selectNode("a");
    useInteractionStore.getState().toggleTheme();
    useInteractionStore.getState().reset();

    const state = useInteractionStore.getState();
    expect(state.graphData).toBeNull();
    expect(state.selectedNodeId).toBeNull();
    expect(state.traceSourceId).toBeNull();
    expect(state.tracePath).toBeNull();
    expect(state.theme).toBe("light");
  });

  it("runs trace between two nodes", () => {
    const graph = fixtureGraph;
    useInteractionStore.getState().setGraphData(graph);
    useInteractionStore.getState().toggleTraceSource("a");
    useInteractionStore.getState().toggleTraceSource("b");
    const state = useInteractionStore.getState();
    // traceSourceId stays as "a" after trace completes
    expect(state.traceSourceId).toBe("a");
    expect(state.tracePath).not.toBeNull();
    expect(state.tracePath!.nodeIds).toContain("a");
    expect(state.tracePath!.nodeIds).toContain("b");
  });
});
