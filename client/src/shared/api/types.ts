/** A single node in the dependency graph (file, class, or function) */
export interface GraphNode {
  id: string;
  label: string;
  kind: "file" | "class" | "interface" | "function" | "variable";
  /** Path relative to project root */
  filePath: string;
  /** Parent container node id (e.g., which file this class lives in) */
  parentId?: string;
  /** Children node ids (e.g., classes inside this file) */
  childIds?: string[];
  /** Metrics for health analysis */
  metrics?: {
    lines: number;
    methodCount: number;
    dependencyCount: number;
    inheritanceDepth: number;
  };
  /** Whether this node is externally accessible */
  isPublic: boolean;
}

/** A directed dependency edge between two nodes */
export interface GraphEdge {
  sourceId: string;
  targetId: string;
  /** The kind of dependency */
  kind: "import" | "extends" | "implements" | "uses";
  /** Whether this is a public or private/protected dependency */
  isAccessible: boolean;
}

/** The full dependency graph */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Project root path for file references */
  projectRoot: string;
}

export type ViewMode = "2d" | "3d";
export type LayoutMode = "force-directed" | "spherical" | "concentric";

/** Search result with highlight info */
export interface SearchResult {
  nodeId: string;
  label: string;
  matchType: "name" | "path" | "type";
}

/** Path between two nodes found by trace */
export interface TracePath {
  nodeIds: string[];
  edgeIds: string[];
  totalAccessible: boolean;
}
