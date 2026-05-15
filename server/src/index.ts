import express from "express";
import multer from "multer";
import { buildGraph } from "./graph/builder.js";
import { analyzeGraph } from "./graph/analyzer.js";
import type { ParserOptions } from "./parsers/index.js";

const app = express();
const PORT = 3001;

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Health check
app.get("/api/hello", (_req, res) => {
  res.json({ status: "ok" });
});

// Parse uploaded files into a dependency graph
app.post("/api/parse", upload.array("files"), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const projectRoot = (req.body?.root as string) || "";
    const fileContents = new Map<string, string>();

    let tsconfigPath: string | undefined;

    for (const file of files) {
      const content = file.buffer.toString("utf-8");
      const filePath = file.originalname;
      fileContents.set(filePath, content);

      // Detect if a tsconfig.json was uploaded
      if (filePath.endsWith("tsconfig.json")) {
        tsconfigPath = filePath;
      }
    }

    const parserOptions: ParserOptions = {
      tsconfigPath,
      detailedNodes: true,
    };

    const filePaths = Array.from(fileContents.keys());
    const result = buildGraph({
      projectRoot,
      filePaths,
      fileContents,
      recursive: false,
      parserOptions,
    });

    const analyzed = analyzeGraph(result.nodes, result.edges);

    res.json(analyzed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Trace path between two nodes
app.get("/api/trace", (req, res) => {
  const { source, target } = req.query as { source?: string; target?: string };
  // TODO: Implement BFS/DFS pathfinding
  res.json({ nodeIds: [], edgeIds: [] });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
