import { parseFile } from "../parsers/index.js";
import type { GraphNode, GraphEdge } from "../types.js";

export interface BuildOptions {
  projectRoot: string;
  /** File paths to analyze (relative to projectRoot) */
  filePaths: string[];
  /** File contents keyed by path */
  fileContents: Map<string, string>;
  /** Whether to follow imports recursively */
  recursive?: boolean;
}

/** Build a unified dependency graph from multiple files */
export function buildGraph(options: BuildOptions): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>();
  const edgeSet = new Set<string>();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const { filePaths, fileContents } = options;

  for (const filePath of filePaths) {
    const content = fileContents.get(filePath);
    if (!content) continue;

    const result = parseFile(content, filePath);

    // Deduplicate nodes
    for (const node of result.nodes) {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
        nodes.push(node);
      }
    }

    // Deduplicate edges
    for (const edge of result.edges) {
      const key = `${edge.sourceId}->${edge.targetId}:${edge.kind}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(edge);
      }
    }
  }

  return { nodes, edges };
}
