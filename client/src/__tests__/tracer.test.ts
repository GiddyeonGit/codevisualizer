import { describe, it, expect } from "vitest";
import { runDijkstra } from "@/shared/lib/tracer";
import type { GraphData, GraphNode, GraphEdge } from "@/shared/api/types";

function makeNode(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    label: overrides.label || id,
    kind: overrides.kind || "file",
    filePath: overrides.filePath || `${id}.ts`,
    isPublic: overrides.isPublic ?? true,
    metrics: overrides.metrics ?? {
      lines: 0,
      methodCount: 0,
      dependencyCount: 0,
      inheritanceDepth: 0,
    },
    reExports: overrides.reExports ?? [],
  };
}

function makeEdge(id: string, sourceId: string, targetId: string, overrides: Partial<GraphEdge> = {}): GraphEdge {
  return {
    id,
    sourceId,
    targetId,
    kind: overrides.kind ?? "import",
    isAccessible: overrides.isAccessible ?? true,
  };
}

function makeGraphData(
  nodeDefs: { id: string }[],
  edgeDefs: { id: string; sourceId: string; targetId: string; kind?: GraphEdge["kind"]; isAccessible?: boolean }[],
): GraphData {
  return {
    nodes: nodeDefs.map((n) => makeNode(n.id)),
    edges: edgeDefs.map((e) => makeEdge(e.id, e.sourceId, e.targetId, { kind: e.kind, isAccessible: e.isAccessible })),
    projectRoot: "/test",
  };
}

describe("runDijkstra", () => {
  it("finds direct accessible path", () => {
    const graph = makeGraphData(
      [{ id: "a" }, { id: "b" }],
      [{ id: "e1", sourceId: "a", targetId: "b", isAccessible: true }],
    );
    const result = runDijkstra(graph, "a", "b");
    expect(result.nodeIds).toEqual(["a", "b"]);
    expect(result.edgeIds).toEqual(["e1"]);
    expect(result.totalAccessible).toBe(true);
  });

  it("finds chained path", () => {
    const graph = makeGraphData(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      [
        { id: "e1", sourceId: "a", targetId: "b", isAccessible: true },
        { id: "e2", sourceId: "b", targetId: "c", isAccessible: true },
      ],
    );
    const result = runDijkstra(graph, "a", "c");
    expect(result.nodeIds).toEqual(["a", "b", "c"]);
    expect(result.edgeIds).toEqual(["e1", "e2"]);
    expect(result.totalAccessible).toBe(true);
  });

  it("returns empty when no path exists", () => {
    const graph = makeGraphData(
      [{ id: "a" }, { id: "b" }],
      [],
    );
    const result = runDijkstra(graph, "a", "b");
    expect(result.nodeIds).toEqual([]);
    expect(result.edgeIds).toEqual([]);
    expect(result.totalAccessible).toBe(false);
  });

  it("handles source === target", () => {
    const graph = makeGraphData(
      [{ id: "a" }],
      [],
    );
    const result = runDijkstra(graph, "a", "a");
    expect(result.nodeIds).toEqual(["a"]);
    expect(result.edgeIds).toEqual([]);
    expect(result.totalAccessible).toBe(true);
  });

  it("prefers accessible over inaccessible path", () => {
    const graph = makeGraphData(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      [
        { id: "e1", sourceId: "a", targetId: "b", isAccessible: true },
        { id: "e2", sourceId: "a", targetId: "c", isAccessible: false },
        { id: "e3", sourceId: "c", targetId: "b", isAccessible: true },
      ],
    );
    const result = runDijkstra(graph, "a", "b");
    expect(result.nodeIds).toEqual(["a", "b"]);
    expect(result.edgeIds).toEqual(["e1"]);
    expect(result.totalAccessible).toBe(true);
  });

  it("returns path with totalAccessible false when only inaccessible path exists", () => {
    const graph = makeGraphData(
      [{ id: "a" }, { id: "b" }],
      [{ id: "e1", sourceId: "a", targetId: "b", isAccessible: false }],
    );
    const result = runDijkstra(graph, "a", "b");
    expect(result.nodeIds).toEqual(["a", "b"]);
    expect(result.edgeIds).toEqual(["e1"]);
    expect(result.totalAccessible).toBe(false);
  });

  it("handles empty graph data", () => {
    const graph = makeGraphData([], []);
    const result = runDijkstra(graph, "a", "b");
    expect(result.nodeIds).toEqual([]);
    expect(result.edgeIds).toEqual([]);
    expect(result.totalAccessible).toBe(false);
  });
});
