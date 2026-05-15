import { create } from "zustand";
import type { GraphData, ViewMode, LayoutMode } from "@/shared/api/types";
import { runDijkstra } from "@/shared/lib/tracer";
import type { TraceResult } from "@/shared/lib/tracer";

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  node: Record<string, string>;
  edge: string;
  edgeInaccessible: string;
  nodeDefault: string;
  accent: string;
  selectionGlow: string;
  tracePath: string;
  traceSource: string;
  traceTarget: string;
  hoverGlow: string;
}

const BASE_NODE_COLORS: Record<string, string> = {
  file: "#60a5fa",
  class: "#34d399",
  interface: "#f472b6",
  function: "#fbbf24",
  variable: "#a78bfa",
  enum: "#fb923c",
  "type-alias": "#2dd4bf",
};

const DARK_COLORS: ThemeColors = {
  bg: "#0f0f13",
  surface: "#1a1a23",
  text: "#e2e8f0",
  textSecondary: "#64748b",
  border: "#2a2a3a",
  node: { ...BASE_NODE_COLORS },
  edge: "#334155",
  edgeInaccessible: "#7f1d1d",
  nodeDefault: "#60a5fa",
  accent: "#3b82f6",
  selectionGlow: "#60a5fa",
  tracePath: "#60a5fa",
  traceSource: "#fbbf24",
  traceTarget: "#34d399",
  hoverGlow: "#93bbfc",
};

const LIGHT_COLORS: ThemeColors = {
  bg: "#f8fafc",
  surface: "#ffffff",
  text: "#1e293b",
  textSecondary: "#64748b",
  border: "#e2e8f0",
  node: { ...BASE_NODE_COLORS },
  edge: "#cbd5e1",
  edgeInaccessible: "#fecaca",
  nodeDefault: "#3b82f6",
  accent: "#2563eb",
  selectionGlow: "#3b82f6",
  tracePath: "#3b82f6",
  traceSource: "#d97706",
  traceTarget: "#059669",
  hoverGlow: "#60a5fa",
};

function getInitialTheme(): "dark" | "light" {
  try {
    const stored = localStorage.getItem("codevisualizer-theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage not available
  }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "dark"; // Default to dark
}

export interface InteractionState {
  graphData: GraphData | null;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  traceSourceId: string | null;
  tracePath: TraceResult | null;
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  theme: "dark" | "light";
  colors: ThemeColors;
  zoomToNode: ((nodeId: string) => boolean) | null;

  // Actions
  setGraphData: (data: GraphData | null) => void;
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  toggleTraceSource: (nodeId: string) => void;
  clearTrace: () => void;
  setViewMode: (mode: ViewMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
  registerZoomToNode: (fn: ((id: string) => boolean) | null) => void;
  reset: () => void;
}

const initialTheme = getInitialTheme();

export const useInteractionStore = create<InteractionState>((set, get) => ({
  // State
  graphData: null,
  selectedNodeId: null,
  hoveredNodeId: null,
  traceSourceId: null,
  tracePath: null,
  viewMode: "3d",
  layoutMode: "spherical",
  theme: initialTheme,
  colors: initialTheme === "dark" ? DARK_COLORS : LIGHT_COLORS,
  zoomToNode: null,

  // Actions
  setGraphData: (data) => set({ graphData: data }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  toggleTraceSource: (nodeId) => {
    const { traceSourceId, graphData } = get();
    if (traceSourceId === nodeId) {
      // Same node clicked again -- deactivate trace
      set({ traceSourceId: null, tracePath: null });
      return;
    }
    if (traceSourceId === null) {
      // Start trace selection
      set({ traceSourceId: nodeId, tracePath: null });
      return;
    }
    // Run trace from existing source to this target
    if (!graphData) return;
    const result = runDijkstra(graphData, traceSourceId, nodeId);
    set({ tracePath: result, traceSourceId });
  },

  clearTrace: () => set({ traceSourceId: null, tracePath: null }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setLayoutMode: (mode) => set({ layoutMode: mode }),

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("codevisualizer-theme", newTheme);
    } catch {
      // localStorage not available
    }
    set({
      theme: newTheme,
      colors: newTheme === "dark" ? DARK_COLORS : LIGHT_COLORS,
    });
  },

  setTheme: (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("codevisualizer-theme", theme);
    } catch {
      // localStorage not available
    }
    set({
      theme,
      colors: theme === "dark" ? DARK_COLORS : LIGHT_COLORS,
    });
  },

  registerZoomToNode: (fn) => set({ zoomToNode: fn }),

  reset: () => {
    const { theme } = get();
    set({
      graphData: null,
      selectedNodeId: null,
      hoveredNodeId: null,
      traceSourceId: null,
      tracePath: null,
      viewMode: "3d",
      layoutMode: "spherical",
      // Preserve theme
      theme,
      colors: theme === "dark" ? DARK_COLORS : LIGHT_COLORS,
      zoomToNode: null,
    });
  },
}));
