import { useInteractionStore } from "@/entities/interaction-store";

const buttonStyle = (
  isActive: boolean,
): React.CSSProperties => ({
  padding: "6px 12px",
  background: isActive ? "var(--color-accent, #3b82f6)" : "transparent",
  color: isActive ? "#fff" : "var(--color-text, #e2e8f0)",
  border: `1px solid ${isActive ? "var(--color-accent, #3b82f6)" : "var(--color-border, #2a2a3a)"}`,
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: isActive ? 600 : 400,
  transition: "all 0.2s ease",
});

export function OverlayControls() {
  const viewMode = useInteractionStore((s) => s.viewMode);
  const layoutMode = useInteractionStore((s) => s.layoutMode);
  const theme = useInteractionStore((s) => s.theme);
  const setViewMode = useInteractionStore((s) => s.setViewMode);
  const setLayoutMode = useInteractionStore((s) => s.setLayoutMode);
  const toggleTheme = useInteractionStore((s) => s.toggleTheme);

  const layouts = [
    { value: "force-directed" as const, label: "Force" },
    { value: "spherical" as const, label: "Globe" },
    { value: "concentric" as const, label: "Rings" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        left: "16px",
        display: "flex",
        gap: "8px",
        alignItems: "center",
        padding: "10px 14px",
        background: "var(--color-surface, #1a1a23)",
        border: "1px solid var(--color-border, #2a2a3a)",
        borderRadius: "10px",
        zIndex: 30,
      }}
    >
      {/* View mode toggle */}
      <div style={{ display: "flex", gap: "4px" }}>
        <button
          style={buttonStyle(viewMode === "2d")}
          onClick={() => setViewMode("2d")}
        >
          2D
        </button>
        <button
          style={buttonStyle(viewMode === "3d")}
          onClick={() => setViewMode("3d")}
        >
          3D
        </button>
      </div>

      <div style={{ width: "1px", height: "20px", background: "var(--color-border, #2a2a3a)" }} />

      {/* Layout mode toggle */}
      <div style={{ display: "flex", gap: "4px" }}>
        {layouts.map((l) => (
          <button
            key={l.value}
            style={buttonStyle(layoutMode === l.value)}
            onClick={() => setLayoutMode(l.value)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ width: "1px", height: "20px", background: "var(--color-border, #2a2a3a)" }} />

      {/* Theme toggle */}
      <button
        style={buttonStyle(false)}
        onClick={toggleTheme}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
