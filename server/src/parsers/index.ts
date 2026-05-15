import type { GraphNode, GraphEdge } from "../types.js";

// Import and register available parsers
import { typescriptParser } from "./typescript.js";
import { pythonParser } from "./python.js";

export interface ParserResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface FileParser {
  supportedExtensions: string[];
  parse(content: string, filePath: string): ParserResult;
}

// Registry of available parsers
const parsers: FileParser[] = [];

export function registerParser(parser: FileParser): void {
  parsers.push(parser);
}

export function getParserForFile(filePath: string): FileParser | null {
  const ext = "." + filePath.split(".").pop()?.toLowerCase();
  return parsers.find((p) => p.supportedExtensions.includes(ext)) ?? null;
}

/** Parse a single file using the appropriate parser */
export function parseFile(content: string, filePath: string): ParserResult {
  const parser = getParserForFile(filePath);
  if (!parser) {
    // Return a generic file node with no dependencies
    return {
      nodes: [
        {
          id: filePath,
          label: filePath.split("/").pop() ?? filePath,
          kind: "file",
          filePath,
          isPublic: true,
        },
      ],
      edges: [],
    };
  }
  return parser.parse(content, filePath);
}

/** Detect language from file path */
export function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    java: "java",
    cs: "csharp",
    go: "go",
    rs: "rust",
  };
  return langMap[ext ?? ""] ?? "unknown";
}

// Register built-in parsers
registerParser(typescriptParser);
registerParser(pythonParser);
