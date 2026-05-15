import { useInteractionStore } from "@/entities/interaction-store";
import type { GraphNode } from "@/shared/api/types";

function getKindColor(kind: string): string {
  const colors: Record<string, string> = {
    file: "#60a5fa",
    class: "#34d399",
    interface: "#f472b6",
    function: "#fbbf24",
    variable: "#a78bfa",
    enum: "#fb923c",
    "type-alias": "#2dd4bf",
  };
  return colors[kind] || "#94a3b8";
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: "12px",
      }}
    >
      <span style={{ color: "var(--color-text-secondary, #64748b)" }}>{label}</span>
      <span style={{ color: "var(--color-text, #e2e8f0)" }}>{value}</span>
    </div>
  );
}

export function DetailPanel() {
  const graphData = useInteractionStore((s) => s.graphData);
  const selectedNodeId = useInteractionStore((s) => s.selectedNodeId);
  const selectNode = useInteractionStore((s) => s.selectNode);

  const node = graphData?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  if (!node) return null;

  // Find imports for this node
  const importEdges = graphData?.edges.filter(
    (e) => e.sourceId === node.id && e.kind === "import",
  ) ?? [];
  const importNodes = importEdges
    .map((e) => graphData?.nodes.find((n) => n.id === e.targetId))
    .filter((n): n is GraphNode => !!n);

  // Find exports (childIds)
  const exportNodes = (node.childIds ?? [])
    .map((childId) => graphData?.nodes.find((n) => n.id === childId))
    .filter((n): n is GraphNode => !!n);

  // Health warnings
  const warnings: string[] = [];
  const metrics = node.metrics;
  if (metrics) {
    if (metrics.lines && metrics.lines > 300)
      warnings.push(
        `Large file (${metrics.lines} lines) -- consider refactoring.`,
      );
    if (metrics.methodCount && metrics.methodCount > 15)
      warnings.push(
        `${metrics.methodCount} methods -- may indicate low cohesion.`,
      );
    if (metrics.inheritanceDepth && metrics.inheritanceDepth > 3)
      warnings.push(
        `Deep inheritance chain (depth ${metrics.inheritanceDepth}).`,
      );
    if (metrics.dependencyCount && metrics.dependencyCount > 10)
      warnings.push(
        `High dependency count (${metrics.dependencyCount} deps).`,
      );
    if (metrics.hasErrors)
      warnings.push("Parse errors detected -- data may be incomplete.");
  }

  // Synthetic code preview
  const codePreview = (() => {
    switch (node.kind) {
      case "class":
        return `class ${node.label} { ... }`;
      case "interface":
        return `interface ${node.label} { ... }`;
      case "function":
        return `function ${node.label}(...) { ... }`;
      case "variable":
        return `const ${node.label} = ...`;
      case "enum":
        return `enum ${node.label} { ... }`;
      case "type-alias":
        return `type ${node.label} = ...`;
      case "file":
        return node.filePath || node.label;
      default:
        return `// ${node.label}`;
    }
  })();

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        right: "16px",
        width: "320px",
        maxHeight: "70vh",
        overflowY: "auto",
        background: "var(--color-surface, #1a1a23)",
        border: "1px solid var(--color-border, #2a2a3a)",
        borderRadius: "12px",
        padding: "16px",
        fontFamily: "system-ui, sans-serif",
        color: "var(--color-text, #e2e8f0)",
        backdropFilter: "blur(12px)",
        zIndex: 30,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 600 }}>{node.label}</div>
        <button
          onClick={() => selectNode(null)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-text-secondary, #64748b)",
            cursor: "pointer",
            fontSize: "18px",
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Kind badge */}
      <div
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 600,
          background: `${getKindColor(node.kind)}22`,
          color: getKindColor(node.kind),
          marginBottom: "12px",
        }}
      >
        {node.kind}
      </div>

      {/* File path */}
      {node.filePath && node.filePath !== node.label && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-text-secondary, #64748b)",
            marginBottom: "12px",
            wordBreak: "break-all",
          }}
        >
          📄 {node.filePath}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--color-text-secondary, #64748b)",
              marginBottom: "6px",
            }}
          >
            Warnings
          </div>
          {warnings.map((w, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                background: w.includes("errors")
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(251, 191, 36, 0.15)",
                color: w.includes("errors") ? "#ef4444" : "#fbbf24",
                marginBottom: "4px",
              }}
            >
              <span>⚠️</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid var(--color-border, #2a2a3a)",
          margin: "8px 0",
        }}
      />

      {/* Metrics Section */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--color-text-secondary, #64748b)",
            marginBottom: "6px",
          }}
        >
          Metrics
        </div>
        {metrics && (
          <>
            <DetailRow label="Lines" value={metrics.lines ?? 0} />
            <DetailRow label="Methods" value={metrics.methodCount ?? 0} />
            <DetailRow label="Dependencies" value={metrics.dependencyCount ?? 0} />
            <DetailRow label="Exports" value={metrics.exportCount ?? 0} />
            <DetailRow label="Inheritance Depth" value={metrics.inheritanceDepth ?? 0} />
          </>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid var(--color-border, #2a2a3a)",
          margin: "8px 0",
        }}
      />

      {/* Imports */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--color-text-secondary, #64748b)",
            marginBottom: "6px",
          }}
        >
          Imports ({importNodes.length})
        </div>
        {importNodes.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary, #64748b)", fontStyle: "italic" }}>
            No imports
          </div>
        ) : (
          importNodes.map((n) => (
            <div
              key={n.id}
              onClick={() => selectNode(n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 6px",
                cursor: "pointer",
                borderRadius: "4px",
                fontSize: "12px",
                color: "var(--color-text, #e2e8f0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-border, #2a2a3a)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: getKindColor(n.kind),
                  display: "inline-block",
                }}
              />
              <span style={{ flex: 1 }}>{n.label}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-secondary, #64748b)" }}>
                {n.kind}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid var(--color-border, #2a2a3a)",
          margin: "8px 0",
        }}
      />

      {/* Exports */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--color-text-secondary, #64748b)",
            marginBottom: "6px",
          }}
        >
          Exports ({exportNodes.length})
        </div>
        {exportNodes.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary, #64748b)", fontStyle: "italic" }}>
            No exports
          </div>
        ) : (
          exportNodes.map((n) => (
            <div
              key={n.id}
              onClick={() => selectNode(n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 6px",
                cursor: "pointer",
                borderRadius: "4px",
                fontSize: "12px",
                color: "var(--color-text, #e2e8f0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-border, #2a2a3a)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: getKindColor(n.kind),
                  display: "inline-block",
                }}
              />
              <span style={{ flex: 1 }}>{n.label}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-secondary, #64748b)" }}>
                {n.kind}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid var(--color-border, #2a2a3a)",
          margin: "8px 0",
        }}
      />

      {/* Code Preview */}
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--color-text-secondary, #64748b)",
            marginBottom: "6px",
          }}
        >
          Code Preview
        </div>
        <pre
          style={{
            padding: "8px 12px",
            background: "var(--color-bg, #0f0f13)",
            border: "1px solid var(--color-border, #2a2a3a)",
            borderRadius: "6px",
            fontSize: "12px",
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            color: "var(--color-text-secondary, #64748b)",
            fontStyle: "italic",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            margin: 0,
          }}
        >
          {codePreview}
        </pre>
      </div>
    </div>
  );
}
