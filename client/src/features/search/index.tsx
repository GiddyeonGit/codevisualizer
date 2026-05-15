import { useState, useMemo, useCallback } from "react";
import { useInteractionStore } from "@/entities/interaction-store";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const graphData = useInteractionStore((s) => s.graphData);
  const traceSourceId = useInteractionStore((s) => s.traceSourceId);
  const clearTrace = useInteractionStore((s) => s.clearTrace);

  const data = graphData;

  const results = useMemo(() => {
    if (!data || !query.trim()) return [];
    const lower = query.toLowerCase();
    return data.nodes
      .filter(
        (n) =>
          n.label.toLowerCase().includes(lower) ||
          n.filePath.toLowerCase().includes(lower),
      )
      .slice(0, 20);
  }, [data, query]);

  const handleResultClick = useCallback((nodeId: string) => {
    const zoomFn = useInteractionStore.getState().zoomToNode;
    if (zoomFn) {
      zoomFn(nodeId);
    }
    setQuery("");
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: "16px",
        left: "16px",
        width: "280px",
        background: "var(--color-overlay-bg, rgba(15,15,19,0.95))",
        border: "1px solid var(--color-border, #334155)",
        borderRadius: "8px",
        padding: "12px",
        fontFamily: "system-ui, sans-serif",
        color: "var(--color-text, #e2e8f0)",
        zIndex: 40,
      }}
    >
      {/* Trace mode indicator */}
      {traceSourceId && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            padding: "6px 10px",
            background: "rgba(251, 191, 36, 0.15)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#fbbf24",
          }}
        >
          <span style={{ flex: 1 }}>
            Trace mode -- Ctrl/Cmd+click a target node
          </span>
          <button
            onClick={clearTrace}
            style={{
              background: "transparent",
              border: "none",
              color: "#fbbf24",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "underline",
              padding: "2px 4px",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search nodes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "var(--color-surface, #1e293b)",
          border: "1px solid var(--color-border, #475569)",
          borderRadius: "6px",
          color: "var(--color-text, #e2e8f0)",
          fontSize: "14px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {results.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
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
                e.currentTarget.style.background = "var(--color-surface, #1e293b)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              onClick={() => handleResultClick(node.id)}
            >
              <span>{node.label}</span>
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary, #64748b)" }}>
                {node.kind}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
