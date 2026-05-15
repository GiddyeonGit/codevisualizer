import type { GraphData } from "@/shared/api/types";

export interface TraceResult {
  nodeIds: string[];
  edgeIds: string[];
  totalAccessible: boolean;
}

export function runDijkstra(
  graphData: GraphData,
  sourceId: string,
  targetId: string,
): TraceResult {
  // Edge case: source === target
  if (sourceId === targetId) {
    return { nodeIds: [sourceId], edgeIds: [], totalAccessible: true };
  }

  // Edge case: empty graph
  if (graphData.nodes.length === 0 || graphData.edges.length === 0) {
    return { nodeIds: [], edgeIds: [], totalAccessible: false };
  }

  // Build adjacency list
  const adjacency = new Map<string, Array<{ nodeId: string; edgeId: string; weight: number }>>();
  for (const edge of graphData.edges) {
    if (!adjacency.has(edge.sourceId)) {
      adjacency.set(edge.sourceId, []);
    }
    adjacency.get(edge.sourceId)!.push({
      nodeId: edge.targetId,
      edgeId: edge.id,
      weight: edge.isAccessible ? 1 : 10,
    });
  }

  // Dijkstra
  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edgeId: string } | null>();
  const unvisited = new Set<string>();

  // Initialize all nodes
  for (const node of graphData.nodes) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  }
  distances.set(sourceId, 0);

  while (unvisited.size > 0) {
    // Find min-distance unvisited node
    let current: string | null = null;
    let minDist = Infinity;
    for (const id of unvisited) {
      const d = distances.get(id)!;
      if (d < minDist) {
        minDist = d;
        current = id;
      }
    }

    if (current === null || current === targetId) break;
    if (minDist === Infinity) break; // No path

    unvisited.delete(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.nodeId)) continue;
      const alt = distances.get(current)! + neighbor.weight;
      if (alt < distances.get(neighbor.nodeId)!) {
        distances.set(neighbor.nodeId, alt);
        previous.set(neighbor.nodeId, { nodeId: current, edgeId: neighbor.edgeId });
      }
    }
  }

  // Reconstruct path
  if (!previous.has(targetId) || previous.get(targetId) === null) {
    return { nodeIds: [], edgeIds: [], totalAccessible: false };
  }

  const nodePath: string[] = [];
  const edgePath: string[] = [];
  let current: string | null = targetId;

  while (current !== null && current !== sourceId) {
    nodePath.unshift(current);
    const prev = previous.get(current);
    if (prev) {
      edgePath.unshift(prev.edgeId);
      current = prev.nodeId;
    } else {
      break;
    }
  }
  nodePath.unshift(sourceId);

  // Check if any edge in path is inaccessible
  const pathEdgeSet = new Set(edgePath);
  const totalAccessible = graphData.edges
    .filter((e) => pathEdgeSet.has(e.id))
    .every((e) => e.isAccessible);

  return { nodeIds: nodePath, edgeIds: edgePath, totalAccessible };
}
