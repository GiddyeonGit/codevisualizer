import type { GraphData } from "./types";

const API_BASE = "/api";

/**
 * Send file contents to the backend for parsing.
 * Returns the constructed dependency graph.
 */
export async function parseProject(files: File[]): Promise<GraphData> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file, file.webkitRelativePath || file.name);
  }

  const response = await fetch(`${API_BASE}/parse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Parse failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a trace path between two nodes.
 */
export async function tracePath(
  sourceId: string,
  targetId: string,
): Promise<{ nodeIds: string[]; edgeIds: string[] }> {
  const response = await fetch(
    `${API_BASE}/trace?source=${sourceId}&target=${targetId}`,
  );
  if (!response.ok) {
    throw new Error(`Trace failed: ${response.statusText}`);
  }
  return response.json();
}
