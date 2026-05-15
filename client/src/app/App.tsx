import { useInteractionStore } from "@/entities/interaction-store";
import { DropZone } from "@/features/drop-zone";
import { Graph3D } from "@/features/graph-3d";
import { Graph2D } from "@/features/graph-2d";
import { SearchPanel } from "@/features/search";
import { OverlayControls } from "@/features/overlay";
import { DetailPanel } from "@/features/details";

export function App() {
  const graphData = useInteractionStore((s) => s.graphData);
  const viewMode = useInteractionStore((s) => s.viewMode);
  const selectedNodeId = useInteractionStore((s) => s.selectedNodeId);
  const reset = useInteractionStore((s) => s.reset);
  const setGraphData = useInteractionStore((s) => s.setGraphData);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "var(--color-bg, #0f0f13)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {graphData ? (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
            {viewMode === "3d" ? <Graph3D /> : <Graph2D />}
          </div>
          <SearchPanel />
          <OverlayControls />
          <DetailPanel />
          <button
            onClick={reset}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              padding: "8px 16px",
              background: "var(--color-surface, #1a1a23)",
              color: "var(--color-text, #e2e8f0)",
              border: "1px solid var(--color-border, #2a2a3a)",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              zIndex: 50,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-accent-hover, #2563eb)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-surface, #1a1a23)";
              e.currentTarget.style.color = "var(--color-text, #e2e8f0)";
            }}
          >
            ← Back
          </button>
        </>
      ) : (
        <DropZone onFileDrop={(data) => setGraphData(data)} />
      )}
    </div>
  );
}
