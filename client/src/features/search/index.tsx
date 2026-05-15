import { useState, useMemo } from "react";
import type { GraphData } from "@/shared/api/types";

interface SearchPanelProps {
  data: GraphData;
}

export function SearchPanel({ data }: SearchPanelProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return data.nodes
      .filter(
        (n) =>
          n.label.toLowerCase().includes(lower) ||
          n.filePath.toLowerCase().includes(lower),
      )
      .slice(0, 20);
  }, [data.nodes, query]);

  return (
    <div
      style={{
        position: "absolute",
        top: "16px",
        left: "16px",
        width: "280px",
        background: "rgba(15,15,19,0.95)",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "12px",
        fontFamily: "system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <input
        type="text"
        placeholder="Search nodes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "#1e293b",
          border: "1px solid #475569",
          borderRadius: "6px",
          color: "#e2e8f0",
          fontSize: "14px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {results.length > 0 && (
        <div style={{ marginTop: "8px", maxHeight: "300px", overflowY: "auto" }}>
          {results.map((node) => (
            <div
              key={node.id}
              style={{
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: "4px",
                fontSize: "13px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              onClick={() => {
                // TODO: zoom camera to this node
              }}
            >
              <span>{node.label}</span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>{node.kind}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
