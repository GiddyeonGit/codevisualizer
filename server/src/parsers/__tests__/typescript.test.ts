import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { typescriptParser } from "../typescript.js";
import type { GraphNode, GraphEdge } from "../../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, "fixtures", "ts");

function readFixture(subDir: string, fileName: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, subDir, fileName), "utf-8");
}

function findNode(nodes: GraphNode[], id: string): GraphNode | undefined {
  return nodes.find((n) => n.id === id);
}

function findNodes(nodes: GraphNode[], kind: GraphNode["kind"]): GraphNode[] {
  return nodes.filter((n) => n.kind === kind);
}

function findEdges(edges: GraphEdge[], sourceId: string, kind: GraphEdge["kind"]): GraphEdge[] {
  return edges.filter((e) => e.sourceId === sourceId && e.kind === kind);
}

describe("TypeScript Parser", () => {
  describe("simple-imports fixture", () => {
    const fixtureDir = "simple-imports";
    let result: ReturnType<typeof typescriptParser.parse>;

    beforeAll(() => {
      const content = readFixture(fixtureDir, "index.ts");
      result = typescriptParser.parse(content, path.join(FIXTURES_DIR, fixtureDir, "index.ts"));
    });

    it("should create a file node for the entry point", () => {
      const fileNode = findNode(result.nodes, path.join(FIXTURES_DIR, fixtureDir, "index.ts"));
      expect(fileNode).toBeDefined();
      expect(fileNode!.kind).toBe("file");
      expect(fileNode!.label).toBe("index.ts");
      expect(fileNode!.isPublic).toBe(true);
    });

    it("should extract import edges", () => {
      const fileId = path.join(FIXTURES_DIR, fixtureDir, "index.ts");
      const importEdges = findEdges(result.edges, fileId, "import");
      expect(importEdges.length).toBeGreaterThanOrEqual(2);

      const mathImport = importEdges.find(
        (e) => e.targetId === path.join(FIXTURES_DIR, fixtureDir, "math.ts"),
      );
      expect(mathImport).toBeDefined();
      expect(mathImport!.isAccessible).toBe(true);

      const utilsImport = importEdges.find(
        (e) => e.targetId === path.join(FIXTURES_DIR, fixtureDir, "utils.ts"),
      );
      expect(utilsImport).toBeDefined();
      expect(utilsImport!.isAccessible).toBe(true);
    });
  });

  describe("classes-and-interfaces fixture", () => {
    const fixtureDir = "classes-and-interfaces";
    const modelsPath = path.join(FIXTURES_DIR, fixtureDir, "models.ts");

    beforeAll(() => {
      const content = readFixture(fixtureDir, "models.ts");
      result = typescriptParser.parse(content, modelsPath);
    });

    let result: ReturnType<typeof typescriptParser.parse>;

    it("should extract class nodes", () => {
      const baseEntity = findNode(result.nodes, `${modelsPath}~BaseEntity`);
      expect(baseEntity).toBeDefined();
      expect(baseEntity!.kind).toBe("class");

      const user = findNode(result.nodes, `${modelsPath}~User`);
      expect(user).toBeDefined();
      expect(user!.kind).toBe("class");
    });

    it("should mark exported classes as public", () => {
      const baseEntity = findNode(result.nodes, `${modelsPath}~BaseEntity`);
      expect(baseEntity!.isPublic).toBe(true);

      const user = findNode(result.nodes, `${modelsPath}~User`);
      expect(user!.isPublic).toBe(true);
    });

    it("should create extends edges for class inheritance", () => {
      const user = findNode(result.nodes, `${modelsPath}~User`);
      expect(user).toBeDefined();
      const userExtends = findEdges(result.edges, `${modelsPath}~User`, "extends");
      expect(userExtends.length).toBeGreaterThanOrEqual(1);
      expect(userExtends.some((e) => e.targetId === "BaseEntity")).toBe(true);
    });

    it("should create implements edges", () => {
      const user = findNode(result.nodes, `${modelsPath}~User`);
      expect(user).toBeDefined();
      const userImplements = findEdges(result.edges, `${modelsPath}~User`, "implements");
      expect(userImplements.length).toBeGreaterThanOrEqual(2);
      const targetNames = userImplements.map((e) => e.targetId);
      expect(targetNames).toContain("Serializable");
      expect(targetNames).toContain("Named");
    });

    it("should count methods on classes", () => {
      const user = findNode(result.nodes, `${modelsPath}~User`);
      expect(user!.metrics!.methodCount).toBeGreaterThanOrEqual(2); // toJSON + getName
    });

    it("should track file-level import edges", () => {
      const importEdges = findEdges(result.edges, modelsPath, "import");
      expect(importEdges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("re-exports fixture", () => {
    const fixtureDir = "re-exports";
    const indexPath = path.join(FIXTURES_DIR, fixtureDir, "index.ts");

    beforeAll(() => {
      const content = readFixture(fixtureDir, "index.ts");
      result = typescriptParser.parse(content, indexPath);
    });

    let result: ReturnType<typeof typescriptParser.parse>;

    it("should create import edges for re-export sources", () => {
      const importEdges = findEdges(result.edges, indexPath, "import");
      // Two re-exports: formatDate/parseDate + DateFormatOptions type
      // But they both go to the same file, should be deduped
      expect(importEdges.length).toBeGreaterThanOrEqual(1);
      const internalEdge = importEdges.find(
        (e) => e.targetId === path.join(FIXTURES_DIR, fixtureDir, "internal.ts"),
      );
      expect(internalEdge).toBeDefined();
    });
  });

  describe("tsconfig path alias resolution", () => {
    const fixtureDir = "with-tsconfig";
    const indexPath = path.join(FIXTURES_DIR, fixtureDir, "src", "index.ts");
    const tsconfigPath = path.join(FIXTURES_DIR, fixtureDir, "tsconfig.json");

    beforeAll(() => {
      const content = readFixture(fixtureDir, "src/index.ts");
      result = typescriptParser.parse(content, indexPath, { tsconfigPath });
    });

    let result: ReturnType<typeof typescriptParser.parse>;

    it("should resolve path aliases to actual file paths", () => {
      const importEdges = findEdges(result.edges, indexPath, "import");
      expect(importEdges.length).toBeGreaterThanOrEqual(1);

      const helperEdge = importEdges.find(
        (e) =>
          e.targetId === path.join(FIXTURES_DIR, fixtureDir, "src", "utils", "helper.ts"),
      );
      expect(helperEdge).toBeDefined();
      expect(helperEdge!.isAccessible).toBe(true);
    });
  });

  describe("enums-and-types fixture", () => {
    const fixtureDir = "enums-and-types";
    const typesPath = path.join(FIXTURES_DIR, fixtureDir, "types.ts");

    beforeAll(() => {
      const content = readFixture(fixtureDir, "types.ts");
      result = typescriptParser.parse(content, typesPath);
    });

    let result: ReturnType<typeof typescriptParser.parse>;

    it("should extract enum nodes", () => {
      const color = findNode(result.nodes, `${typesPath}~Color`);
      expect(color).toBeDefined();
      expect(color!.kind).toBe("enum");
      expect(color!.isPublic).toBe(true);

      const direction = findNode(result.nodes, `${typesPath}~Direction`);
      expect(direction).toBeDefined();
      expect(direction!.kind).toBe("enum");
    });

    it("should extract type alias nodes", () => {
      const status = findNode(result.nodes, `${typesPath}~Status`);
      expect(status).toBeDefined();
      expect(status!.kind).toBe("type-alias");
      expect(status!.isPublic).toBe(true);
    });

    it("should extract variable (constant) nodes", () => {
      const defaultConfig = findNode(result.nodes, `${typesPath}~DEFAULT_CONFIG`);
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig!.kind).toBe("variable");
    });

    it("should extract interface nodes", () => {
      const config = findNode(result.nodes, `${typesPath}~Config`);
      expect(config).toBeDefined();
      expect(config!.kind).toBe("interface");
    });

    it("should include all expected entity kinds", () => {
      const kinds = result.nodes.map((n) => n.kind);
      expect(kinds).toContain("enum");
      expect(kinds).toContain("type-alias");
      expect(kinds).toContain("variable");
      expect(kinds).toContain("interface");
    });
  });

  describe("syntax errors", () => {
    const fixtureDir = "syntax-errors";
    const brokenPath = path.join(FIXTURES_DIR, fixtureDir, "broken.ts");

    beforeAll(() => {
      const content = readFixture(fixtureDir, "broken.ts");
      result = typescriptParser.parse(content, brokenPath);
    });

    let result: ReturnType<typeof typescriptParser.parse>;

    it("should mark the file node with hasErrors = true", () => {
      const fileNode = findNode(result.nodes, brokenPath);
      expect(fileNode).toBeDefined();
      expect(fileNode!.metrics!.hasErrors).toBe(true);
    });

    it("should still extract valid declarations despite errors", () => {
      const validFunction = findNode(result.nodes, `${brokenPath}~validFunction`);
      expect(validFunction).toBeDefined();
      expect(validFunction!.kind).toBe("function");
    });

    it("should still produce import edges for valid imports", () => {
      const importEdges = findEdges(result.edges, brokenPath, "import");
      expect(importEdges.length).toBeGreaterThanOrEqual(1);
    });

    it("should not throw an exception for malformed code", () => {
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(Array.isArray(result.edges)).toBe(true);
    });
  });

  describe("detailedNodes option", () => {
    const fixtureDir = "enums-and-types";
    const typesPath = path.join(FIXTURES_DIR, fixtureDir, "types.ts");

    it("should skip detailed entities when detailedNodes = false", () => {
      const content = readFixture(fixtureDir, "types.ts");
      const result = typescriptParser.parse(content, typesPath, { detailedNodes: false });

      // File node should exist
      const fileNode = findNode(result.nodes, typesPath);
      expect(fileNode).toBeDefined();

      // Detailed entity kinds should NOT be present
      const entityKinds = result.nodes.filter(
        (n) => n.kind !== "file",
      );
      // With detailedNodes=false, we should have fewer entities
      // The only non-file nodes should be classes, interfaces (structural)
      for (const n of entityKinds) {
        expect(["class", "interface", "file"]).toContain(n.kind);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty file gracefully", () => {
      const result = typescriptParser.parse("", "/empty.ts");
      const fileNode = findNode(result.nodes, "/empty.ts");
      expect(fileNode).toBeDefined();
      expect(fileNode!.kind).toBe("file");
      expect(fileNode!.metrics!.lines).toBe(1);
      expect(fileNode!.metrics!.hasErrors).toBe(false);
    });

    it("should mark external dependencies", () => {
      const content = `
        import express from "express";
        import { resolve } from "path";
        import { something } from "@org/package";
      `;
      const result = typescriptParser.parse(content, "/test.ts");
      const importEdges = findEdges(result.edges, "/test.ts", "import");
      const externalEdges = importEdges.filter((e) => e.targetId.startsWith("external:"));
      expect(externalEdges.length).toBe(3);
      expect(externalEdges.some((e) => e.targetId === "external:express")).toBe(true);
      expect(externalEdges.some((e) => e.targetId === "external:path")).toBe(true);
      expect(externalEdges.some((e) => e.targetId === "external:@org/package")).toBe(true);
    });

    it("should not treat external deps as accessible", () => {
      const content = `import fs from "fs";`;
      const result = typescriptParser.parse(content, "/test.ts");
      const importEdges = findEdges(result.edges, "/test.ts", "import");
      const extEdge = importEdges.find((e) => e.targetId.startsWith("external:"));
      expect(extEdge).toBeDefined();
      expect(extEdge!.isAccessible).toBe(false);
    });

    it("should handle require() calls as import edges", () => {
      const content = `const fs = require("fs");\nconst path = require("path");`;
      const result = typescriptParser.parse(content, "/test.ts");
      const importEdges = findEdges(result.edges, "/test.ts", "import");
      const extEdges = importEdges.filter((e) => e.targetId.startsWith("external:"));
      expect(extEdges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("metrics", () => {
    it("should calculate correct line count for file nodes", () => {
      const content = "line1\nline2\nline3\n";
      const result = typescriptParser.parse(content, "/metrics.ts");
      const fileNode = findNode(result.nodes, "/metrics.ts");
      expect(fileNode!.metrics!.lines).toBe(4); // 3 lines + trailing newline = 4 split parts
    });

    it("should track export count on file nodes", () => {
      const fixtureDir = "simple-imports";
      const mathContent = readFixture(fixtureDir, "math.ts");
      const mathPath = path.join(FIXTURES_DIR, fixtureDir, "math.ts");
      const result = typescriptParser.parse(mathContent, mathPath);
      const fileNode = findNode(result.nodes, mathPath);
      expect(fileNode!.metrics!.exportCount).toBeGreaterThanOrEqual(2); // add + subtract
    });

    it("should track dependency count on file nodes", () => {
      const content = `import a from "./a";\nimport b from "./b";\nconst c = require("./c");`;
      const result = typescriptParser.parse(content, "/deps.ts");
      const fileNode = findNode(result.nodes, "/deps.ts");
      expect(fileNode!.metrics!.dependencyCount).toBeGreaterThanOrEqual(3);
    });
  });
});
