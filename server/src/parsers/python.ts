import type { FileParser, ParserResult } from "./index.js";

/**
 * Parse Python files for imports and class declarations.
 * TODO: Replace with Python AST parser (via child_process or WASM).
 */
export const pythonParser: FileParser = {
  supportedExtensions: [".py"],

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
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+(\S+(?:\s*,\s*\S+)*)/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const source = match[1]; // module from which to import
      const targets = match[2]; // what to import
      if (source) {
        edges.push({
          sourceId: fileId,
          targetId: source.replace(/\./g, "/"),
          kind: "import",
          isAccessible: true,
        });
      } else {
        const modules = targets.split(",").map((m) => m.trim().split(" ")[0]);
        for (const mod of modules) {
          edges.push({
            sourceId: fileId,
            targetId: mod.replace(/\./g, "/"),
            kind: "import",
            isAccessible: true,
          });
        }
      }
    }

    // Extract class declarations
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const classId = `${fileId}::${className}`;
      nodes.push({
        id: classId,
        label: className,
        kind: "class",
        filePath,
        parentId: fileId,
        isPublic: true,
      });
      nodes.find((n) => n.id === fileId)?.childIds?.push(classId);
    }

    return { nodes, edges };
  },
};
