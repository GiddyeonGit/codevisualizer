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

  const handleFileDrop = useCallback((data: GraphData) => {
    setGraphData(data);
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
            <Graph2D data={graphData} />
          )}

          {/* Floating UI panels */}
          <SearchPanel data={graphData} />
          <OverlayControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
          />
          <DetailPanel />
        </>
      )}
    </div>
  );
}
