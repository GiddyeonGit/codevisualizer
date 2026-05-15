import type { ViewMode, LayoutMode } from "@/shared/api/types";

interface OverlayControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
}

function buttonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    fontSize: "12px",
    border: `1px solid ${active ? "#3b82f6" : "#475569"}`,
    borderRadius: "6px",
    background: active ? "rgba(59,130,246,0.15)" : "transparent",
    color: active ? "#3b82f6" : "#94a3b8",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  };
}

export function OverlayControls({
  viewMode,
  onViewModeChange,
  layoutMode,
  onLayoutModeChange,
}: OverlayControlsProps) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        left: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px",
        background: "rgba(15,15,19,0.95)",
        border: "1px solid #334155",
        borderRadius: "8px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* View mode toggle */}
      <div style={{ display: "flex", gap: "4px" }}>
        <button
          style={buttonStyle(viewMode === "2d")}
          onClick={() => onViewModeChange("2d")}
        >
          2D
        </button>
        <button
          style={buttonStyle(viewMode === "3d")}
          onClick={() => onViewModeChange("3d")}
        >
          3D
        </button>
      </div>

      {/* Layout mode selector */}
      <div style={{ display: "flex", gap: "4px" }}>
        {(["force-directed", "spherical", "concentric"] as LayoutMode[]).map(
          (mode) => (
            <button
              key={mode}
              style={buttonStyle(layoutMode === mode)}
              onClick={() => onLayoutModeChange(mode)}
            >
              {mode === "force-directed"
                ? "Force"
                : mode === "spherical"
                  ? "Globe"
                  : "Rings"}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
