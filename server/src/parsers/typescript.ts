import type { FileParser, ParserResult } from "./index.js";

/**
 * Parse TypeScript/JavaScript files for imports and class declarations.
 * TODO: Replace with TypeScript compiler API for deeper analysis.
 */
export const typescriptParser: FileParser = {
  supportedExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],

  parse(content: string, filePath: string): ParserResult {
    const nodes: ParserResult["nodes"] = [];
    const edges: ParserResult["edges"] = [];

    const fileName = filePath.split("/").pop() ?? filePath;
    const fileId = filePath;
    nodes.push({
      id: fileId,
      label: fileName,
      kind: "file",
      filePath,
      isPublic: true,
      childIds: [],
    });

    // Extract import statements
    const importRegex =
      /(?:import\s+(?:(?:\{[^}]*\}|[^;{]+)\s+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const depPath = match[1] ?? match[2];
      const depId = resolveDependencyPath(filePath, depPath);
      if (depId) {
        edges.push({
          sourceId: fileId,
          targetId: depId,
          kind: "import",
          isAccessible: true,
        });
      }
    }

    // Extract class declarations
    const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const classId = `${fileId}::${className}`;
      nodes.push({
        id: classId,
        label: className,
        kind: "class",
        filePath,
        parentId: fileId,
        isPublic: content.includes(`export class ${className}`),
      });
      // Link class to its parent file
      if (fileId) {
        nodes.find((n) => n.id === fileId)?.childIds?.push(classId);
      }
    }

    return { nodes, edges };
  },
};

/** Resolve a relative import path to an absolute node ID */
function resolveDependencyPath(currentPath: string, importPath: string): string | null {
  if (importPath.startsWith(".")) {
    // Relative import — resolve from current file's directory
    const parts = currentPath.split("/");
    parts.pop(); // Remove current file
    const resolved = resolveRelativePath(parts.join("/"), importPath);
    return resolved;
  }
  // External package — store as-is
  return `external:${importPath}`;
}

function resolveRelativePath(dir: string, relative: string): string {
  const parts = relative.split("/");
  const dirParts = dir.split("/");
  for (const part of parts) {
    if (part === "..") dirParts.pop();
    else if (part !== ".") dirParts.push(part);
  }
  return dirParts.join("/");
}
