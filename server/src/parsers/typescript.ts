import ts from "typescript";
import path from "path";
import fs from "fs";
import type { GraphNode, GraphEdge } from "../types.js";
import type { FileParser, ParserOptions, ParserResult } from "./index.js";

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

let cachedTsconfig: { baseUrl?: string; paths?: Record<string, string[]> } | null = null;
let cachedTsconfigPath: string | null = null;

function getScriptKind(filePath: string): ts.ScriptKind {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".tsx": return ts.ScriptKind.TSX;
    case ".jsx": return ts.ScriptKind.JSX;
    case ".mjs":
    case ".cjs":
    case ".js": return ts.ScriptKind.JS;
    default: return ts.ScriptKind.TS;
  }
}

function loadTsconfig(tsconfigPath?: string): void {
  if (!tsconfigPath) return;
  if (tsconfigPath === cachedTsconfigPath && cachedTsconfig) return;
  try {
    const content = fs.readFileSync(tsconfigPath, "utf-8");
    const parsed = JSON.parse(content);
    const compilerOptions = parsed.compilerOptions || {};
    cachedTsconfig = {
      baseUrl: compilerOptions.baseUrl,
      paths: compilerOptions.paths,
    };
    cachedTsconfigPath = tsconfigPath;
  } catch {
    cachedTsconfig = null;
    cachedTsconfigPath = null;
  }
}

function tryExtensions(base: string): string | null {
  const extensionsToTry = [".ts", ".tsx", ".d.ts", ".js", ".jsx", ".mjs", ".cjs"];
  for (const ext of extensionsToTry) {
    const candidate = base + ext;
    if (fs.existsSync(candidate)) return path.normalize(candidate);
  }

  const indexExtensions = [".ts", ".tsx", ".d.ts", ".js", ".jsx"];
  for (const ext of indexExtensions) {
    const candidate = path.join(base, "index" + ext);
    if (fs.existsSync(candidate)) return path.normalize(candidate);
  }

  return null;
}

function resolveDependencyPath(
  importPath: string,
  currentFilePath: string,
  tsconfigPath?: string,
): string {
  // Try tsconfig path resolution first (covers path aliases like @utils/*)
  if (tsconfigPath) {
    loadTsconfig(tsconfigPath);
    if (cachedTsconfig?.paths) {
      for (const [alias, targets] of Object.entries(cachedTsconfig.paths)) {
        const aliasGlob = alias.replace("*", "(.*)");
        const regex = new RegExp(`^${aliasGlob}$`);
        const match = importPath.match(regex);
        if (match && targets.length > 0) {
          const resolvedTarget = targets[0].replace("*", match[1]);
          const baseDir = cachedTsconfig.baseUrl
            ? path.resolve(path.dirname(tsconfigPath), cachedTsconfig.baseUrl)
            : path.dirname(tsconfigPath);
          const resolvedPath = path.resolve(baseDir, resolvedTarget);
          // Probe extensions on the resolved path
          const extProbeResult = tryExtensions(resolvedPath);
          if (extProbeResult) return extProbeResult;
          return resolvedPath;
        }
      }
    }
  }

  // External dependency (not starting with . or / and not matched by tsconfig)
  if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
    const pkgName = importPath.startsWith("@") ? importPath.split("/").slice(0, 2).join("/") : importPath.split("/")[0];
    return `external:${pkgName}`;
  }

  // Extension probing for relative/absolute paths
  const dir = path.dirname(currentFilePath);
  const base = path.resolve(dir, importPath);

  const extResult = tryExtensions(base);
  if (extResult) return extResult;

  // Return the unresolved path as fallback
  return path.normalize(base);
}

function getNodeLocation(node: ts.Node, sourceFile: ts.SourceFile): { line: number; offset: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: line + 1, offset: character };
}

export const typescriptParser: FileParser = {
  supportedExtensions: SUPPORTED_EXTENSIONS,

  parse(content: string, filePath: string, options?: ParserOptions): ParserResult {
    const detailedNodes = options?.detailedNodes ?? true;
    const tsconfigPath = options?.tsconfigPath;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const fileNodeId = filePath;

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      getScriptKind(filePath),
    );

    const hasSyntaxErrors = (sourceFile as any).parseDiagnostics?.length > 0;

    // Create file-level node
    const fileNode: GraphNode = {
      id: fileNodeId,
      label: path.basename(filePath),
      kind: "file",
      filePath,
      isPublic: true,
      childIds: [],
      metrics: {
        lines: content.split("\n").length,
        methodCount: 0,
        dependencyCount: 0,
        inheritanceDepth: 0,
        exportCount: 0,
        hasErrors: hasSyntaxErrors,
      },
    };
    nodes.push(fileNode);

    // Track declarations and imports
    let exportCount = 0;
    const importEdges: { importPath: string; isTypeOnly: boolean; namedBindings?: string[] }[] = [];

    // First pass: collect imports and re-exports
    ts.forEachChild(sourceFile, function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const importPath = moduleSpecifier.text;
          const isTypeOnly = node.importClause?.isTypeOnly ?? false;
          const namedBindings: string[] = [];
          if (node.importClause?.namedBindings) {
            const bindings = node.importClause.namedBindings;
            if (ts.isNamedImports(bindings)) {
              for (const el of bindings.elements) {
                namedBindings.push(el.name.text);
              }
            }
          }
          importEdges.push({ importPath, isTypeOnly, namedBindings: namedBindings.length > 0 ? namedBindings : undefined });
        }
      }

      if (ts.isExportDeclaration(node)) {
        // Handle re-exports: export { X } from '...' or export * from '...'
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const reExportPath = node.moduleSpecifier.text;
          importEdges.push({ importPath: reExportPath, isTypeOnly: false });
          // Track re-export source
          const resolvedReExport = resolveDependencyPath(reExportPath, filePath, tsconfigPath);
          if (!fileNode.reExports) fileNode.reExports = [];
          fileNode.reExports.push({ sourceId: resolvedReExport, sourcePath: resolvedReExport });
        }
      }

      ts.forEachChild(node, visit);
    });

    // Resolve imports and create edges
    for (const imp of importEdges) {
      const resolvedPath = resolveDependencyPath(imp.importPath, filePath, tsconfigPath);
      const isExternal = resolvedPath.startsWith("external:");
      edges.push({
        sourceId: fileNodeId,
        targetId: resolvedPath,
        kind: "import",
        isAccessible: !isExternal,
      });
    }

    // Set dependency count
    fileNode.metrics!.dependencyCount = importEdges.length;

    // Second pass: extract declarations
    function visitDeclarations(node: ts.Node): void {
      const isExported = hasExportModifier(node);

      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;
        const classId = `${filePath}~${className}`;
        if (isExported) exportCount++;

        const methodCount = countChildren(node, ts.isMethodDeclaration);
        let inheritanceDepth = 0;

        // Handle extends
        if (node.heritageClauses) {
          for (const clause of node.heritageClauses) {
            for (const type of clause.types) {
              const typeName = type.expression.getText(sourceFile);
              if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                inheritanceDepth = 1; // Simplified -- would need chain resolution
                edges.push({
                  sourceId: classId,
                  targetId: typeName,
                  kind: "extends",
                  isAccessible: true,
                });
              } else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
                edges.push({
                  sourceId: classId,
                  targetId: typeName,
                  kind: "implements",
                  isAccessible: true,
                });
              }
            }
          }
        }

        nodes.push({
          id: classId,
          label: className,
          kind: "class",
          filePath,
          parentId: fileNodeId,
          isPublic: isExported,
          metrics: {
            lines: getNodeLines(node, sourceFile),
            methodCount,
            dependencyCount: 0,
            inheritanceDepth,
            exportCount: 0,
          },
        });
        fileNode.childIds!.push(classId);
      }

      if (ts.isInterfaceDeclaration(node) && node.name) {
        const ifaceName = node.name.text;
        const ifaceId = `${filePath}~${ifaceName}`;
        if (isExported) exportCount++;

        if (node.heritageClauses) {
          for (const clause of node.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
              for (const type of clause.types) {
                const typeName = type.expression.getText(sourceFile);
                edges.push({
                  sourceId: ifaceId,
                  targetId: typeName,
                  kind: "extends",
                  isAccessible: true,
                });
              }
            }
          }
        }

        nodes.push({
          id: ifaceId,
          label: ifaceName,
          kind: "interface",
          filePath,
          parentId: fileNodeId,
          isPublic: isExported,
          metrics: {
            lines: getNodeLines(node, sourceFile),
            methodCount: 0,
            dependencyCount: 0,
            inheritanceDepth: 0,
          },
        });
        fileNode.childIds!.push(ifaceId);
      }

      if (detailedNodes) {
        if (ts.isFunctionDeclaration(node) && node.name) {
          const funcName = node.name.text;
          const funcId = `${filePath}~${funcName}`;
          if (isExported) exportCount++;

          nodes.push({
            id: funcId,
            label: funcName,
            kind: "function",
            filePath,
            parentId: fileNodeId,
            isPublic: isExported,
            metrics: {
              lines: getNodeLines(node, sourceFile),
              methodCount: 0,
              dependencyCount: 0,
              inheritanceDepth: 0,
            },
          });
          fileNode.childIds!.push(funcId);
        }

        if (ts.isVariableStatement(node)) {
          for (const decl of node.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) {
              const varName = decl.name.text;
              const varId = `${filePath}~${varName}`;
              if (isExported) exportCount++;

              nodes.push({
                id: varId,
                label: varName,
                kind: "variable",
                filePath,
                parentId: fileNodeId,
                isPublic: isExported,
                metrics: {
                  lines: getNodeLines(decl, sourceFile),
                  methodCount: 0,
                  dependencyCount: 0,
                  inheritanceDepth: 0,
                },
              });
              fileNode.childIds!.push(varId);
            }
          }
        }

        if (ts.isEnumDeclaration(node) && node.name) {
          const enumName = node.name.text;
          const enumId = `${filePath}~${enumName}`;
          if (isExported) exportCount++;

          nodes.push({
            id: enumId,
            label: enumName,
            kind: "enum",
            filePath,
            parentId: fileNodeId,
            isPublic: isExported,
            metrics: {
              lines: getNodeLines(node, sourceFile),
              methodCount: 0,
              dependencyCount: 0,
              inheritanceDepth: 0,
            },
          });
          fileNode.childIds!.push(enumId);
        }

        if (ts.isTypeAliasDeclaration(node) && node.name) {
          const aliasName = node.name.text;
          const aliasId = `${filePath}~${aliasName}`;
          if (isExported) exportCount++;

          nodes.push({
            id: aliasId,
            label: aliasName,
            kind: "type-alias",
            filePath,
            parentId: fileNodeId,
            isPublic: isExported,
            metrics: {
              lines: getNodeLines(node, sourceFile),
              methodCount: 0,
              dependencyCount: 0,
              inheritanceDepth: 0,
            },
          });
          fileNode.childIds!.push(aliasId);
        }
      }

      // Also extract require() calls
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        if (ts.isIdentifier(expr) && expr.text === "require" && node.arguments.length > 0) {
          const arg = node.arguments[0];
          if (ts.isStringLiteral(arg)) {
            const resolvedPath = resolveDependencyPath(arg.text, filePath, tsconfigPath);
            const isExternal = resolvedPath.startsWith("external:");
            edges.push({
              sourceId: fileNodeId,
              targetId: resolvedPath,
              kind: "import",
              isAccessible: !isExternal,
            });
            fileNode.metrics!.dependencyCount = (fileNode.metrics!.dependencyCount ?? 0) + 1;
          }
        }
      }

      ts.forEachChild(node, visitDeclarations);
    }

    try {
      visitDeclarations(sourceFile);
    } catch {
      fileNode.metrics!.hasErrors = true;
    }

    fileNode.metrics!.exportCount = exportCount;

    return { nodes, edges };
  },
};

function hasExportModifier(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  if (!modifiers) return false;
  return modifiers.some((m: ts.Modifier) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function countChildren(node: ts.Node, predicate: (child: ts.Node) => boolean): number {
  let count = 0;
  ts.forEachChild(node, (child) => {
    if (predicate(child)) count++;
  });
  return count;
}

function getNodeLines(node: ts.Node, sourceFile: ts.SourceFile): number {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line;
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
  return end - start + 1;
}
