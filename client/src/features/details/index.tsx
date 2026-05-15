import type { GraphNode, GraphData } from "@/shared/api/types";

interface DetailPanelProps {
  data?: GraphData;
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string | null) => void;
}

export function DetailPanel({ data, selectedNodeId, onNodeSelect }: DetailPanelProps) {
  const selectedNode = selectedNodeId ? data?.nodes.find((n) => n.id === selectedNodeId) : null;

  const handleClose = () => {
    onNodeSelect?.(null);
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        right: "16px",
        width: "280px",
        maxHeight: "360px",
        background: "rgba(15,15,19,0.96)",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "14px",
        fontFamily: "system-ui, sans-serif",
        color: "#e2e8f0",
        fontSize: "13px",
        overflowY: "auto",
        backdropFilter: "blur(8px)",
        display: selectedNodeId && selectedNode ? "block" : "none",
      }}
    >
      {selectedNode && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedNode.label}
            </div>
            <button
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "16px",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 500,
              background: getKindColor(selectedNode.kind),
              color: "#fff",
              marginBottom: "10px",
            }}
          >
            {selectedNode.kind}
          </div>

          {selectedNode.filePath && (
            <DetailRow label="Path" value={selectedNode.filePath} />
          )}

          {selectedNode.metrics && (
            <>
              {selectedNode.metrics.lines !== undefined && (
                <DetailRow label="Lines" value={`${selectedNode.metrics.lines}`} />
              )}
              {selectedNode.metrics.methodCount !== undefined && (
                <DetailRow label="Methods" value={`${selectedNode.metrics.methodCount}`} />
              )}
              {selectedNode.metrics.dependencyCount !== undefined && (
                <DetailRow label="Dependencies" value={`${selectedNode.metrics.dependencyCount}`} />
              )}
              {selectedNode.metrics.exportCount !== undefined && (
                <DetailRow label="Exports" value={`${selectedNode.metrics.exportCount}`} />
              )}
              {selectedNode.metrics.inheritanceDepth !== undefined && selectedNode.metrics.inheritanceDepth > 0 && (
                <DetailRow label="Inheritance depth" value={`${selectedNode.metrics.inheritanceDepth}`} />
              )}
              {selectedNode.metrics.hasErrors && (
                <div style={{ color: "#ef4444", marginTop: "6px", fontSize: "12px" }}>
                  ⚠ Parse errors detected
                </div>
              )}
            </>
          )}

          {selectedNode.childIds && selectedNode.childIds.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>CHILDREN ({selectedNode.childIds.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {selectedNode.childIds.map((cid) => (
                  <span
                    key={cid}
                    style={{
                      padding: "1px 6px",
                      background: "#1e293b",
                      borderRadius: "3px",
                      fontSize: "11px",
                      color: "#94a3b8",
                    }}
                  >
                    {cid.split("~").pop()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ color: "#e2e8f0", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function getKindColor(kind: string): string {
  switch (kind) {
    case "file": return "#3b82f6";
    case "class": return "#8b5cf6";
    case "interface": return "#06b6d4";
    case "function": return "#10b981";
    case "variable": return "#f59e0b";
    case "enum": return "#ec4899";
    case "type-alias": return "#14b8a6";
    default: return "#64748b";
  }
}
