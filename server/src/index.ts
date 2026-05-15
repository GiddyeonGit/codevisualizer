import express from "express";
import multer from "multer";

const app = express();
const PORT = 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Health check
app.get("/api/hello", (_req, res) => {
  res.json({ status: "ok" });
});

// Parse uploaded files into dependency graph
app.post("/api/parse", upload.array("files"), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    // TODO: route files to appropriate parser based on extension
    // For now, return stub graph
    res.json({
      nodes: [],
      edges: [],
      projectRoot: "",
    });
  } catch (err) {
    console.error("Parse error:", err);
    res.status(500).json({ error: "Parse failed" });
  }
});

// Trace path between two nodes
app.get("/api/trace", (req, res) => {
  const { source, target } = req.query;
  if (!source || !target) {
    res.status(400).json({ error: "source and target required" });
    return;
  }

  // TODO: implement BFS/DFS pathfinding
  res.json({ nodeIds: [], edgeIds: [] });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
