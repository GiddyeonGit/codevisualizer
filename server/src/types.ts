export interface GraphNode {
  id: string;
  label: string;
  kind: "file" | "class" | "interface" | "function" | "variable";
  filePath: string;
  parentId?: string;
  childIds?: string[];
  metrics?: {
    lines: number;
    methodCount: number;
    dependencyCount: number;
    inheritanceDepth: number;
  };
  isPublic: boolean;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  kind: "import" | "extends" | "implements" | "uses";
  isAccessible: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  projectRoot: string;
}
