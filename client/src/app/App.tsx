import { useState, useCallback } from "react";
import { DropZone } from "@/features/drop-zone";
import { Graph3D } from "@/features/graph-3d";
import { Graph2D } from "@/features/graph-2d";
import { SearchPanel } from "@/features/search";
import { OverlayControls } from "@/features/overlay";
import { DetailPanel } from "@/features/details";
import type { GraphData, ViewMode, LayoutMode } from "@/shared/api/types";

export function App() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("force-directed");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleFileDrop = useCallback((data: GraphData) => {
    setGraphData(data);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleReset = useCallback(() => {
    setGraphData(null);
    setSelectedNodeId(null);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      {!graphData ? (
        <DropZone onFileDrop={handleFileDrop} />
      ) : (
        <>
          {viewMode === "3d" ? (
            <Graph3D data={graphData} layout={layoutMode} />
          ) : (
            <Graph2D data={graphData} onNodeClick={handleNodeClick} />
          )}

          {/* Floating UI panels */}
          <SearchPanel data={graphData} />
          <OverlayControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
          />
          <DetailPanel
            data={graphData ?? undefined}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
          />

          {/* Back button */}
          <button
            onClick={handleReset}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              padding: "8px 14px",
              background: "rgba(15,15,19,0.9)",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#94a3b8",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "system-ui, sans-serif",
              zIndex: 10,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1e293b";
              e.currentTarget.style.color = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(15,15,19,0.9)";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            ← Back
          </button>
        </>
      )}
    </div>
  );
}
