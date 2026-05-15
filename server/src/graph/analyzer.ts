import type { GraphNode, GraphEdge } from "../types.js";

export interface HealthReport {
  circularDependencies: string[][];
  godClasses: string[];
  deepInheritance: string[];
  dipViolations: string[];
  hubSpokeCoupling: string[];
  lowCohesion: string[];
  missingTypeCoverage: string[];
  /** Overall health score 0-100 */
  healthScore: number;
}

/** Run all 7 health checks on the graph */
export function analyzeGraph(nodes: GraphNode[], edges: GraphEdge[]): HealthReport {
  const circularDeps = detectCircularDependencies(nodes, edges);
  const gods = detectGodClasses(nodes);
  const deepInherit = detectDeepInheritance(nodes, edges);
  const dip = detectDIPViolations(nodes, edges);
  const hubs = detectHubSpokeCoupling(nodes, edges);
  const cohesion = detectLowCohesion(nodes);
  const typeCoverage = detectMissingTypeCoverage(nodes);

  const totalIssues =
    circularDeps.length +
    gods.length +
    deepInherit.length +
    dip.length +
    hubs.length +
    cohesion.length +
    typeCoverage.length;

  const maxPossible = nodes.length * 7;
  const healthScore = maxPossible > 0
    ? Math.round((1 - totalIssues / maxPossible) * 100)
    : 100;

  return {
    circularDependencies: circularDeps,
    godClasses: gods,
    deepInheritance: deepInherit,
    dipViolations: dip,
    hubSpokeCoupling: hubs,
    lowCohesion: cohesion,
    missingTypeCoverage: typeCoverage,
    healthScore,
  };
}

function detectCircularDependencies(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  // TODO: implement Tarjan's or DFS-based cycle detection
  return [];
}

function detectGodClasses(nodes: GraphNode[]): string[] {
  return nodes
    .filter((n) => n.metrics && n.metrics.lines > 500)
    .map((n) => n.id);
}

function detectDeepInheritance(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  return nodes
    .filter((n) => n.metrics && n.metrics.inheritanceDepth > 3)
    .map((n) => n.id);
}

function detectDIPViolations(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  // TODO: implement DIP violation detection
  return [];
}

function detectHubSpokeCoupling(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  // Find nodes with unusually high edge count (hubs)
  const edgeCounts = new Map<string, number>();
  for (const edge of edges) {
    edgeCounts.set(edge.sourceId, (edgeCounts.get(edge.sourceId) ?? 0) + 1);
    edgeCounts.set(edge.targetId, (edgeCounts.get(edge.targetId) ?? 0) + 1);
  }
  const avg = edgeCounts.size > 0
    ? [...edgeCounts.values()].reduce((a, b) => a + b, 0) / edgeCounts.size
    : 0;

  return [...edgeCounts.entries()]
    .filter(([_, count]) => count > avg * 3)
    .map(([id]) => id);
}

function detectLowCohesion(nodes: GraphNode[]): string[] {
  // TODO: implement cohesion scoring
  return [];
}

function detectMissingTypeCoverage(nodes: GraphNode[]): string[] {
  // TODO: implement type coverage check
  return [];
}
