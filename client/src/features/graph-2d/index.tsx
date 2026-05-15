import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { GraphData, GraphNode, GraphEdge } from "@/shared/api/types";

interface Graph2DProps {
  data: GraphData;
  onNodeClick?: (nodeId: string) => void;
}

const NODE_COLORS: Record<string, string> = {
  file: "#3b82f6",
  class: "#8b5cf6",
  interface: "#06b6d4",
  function: "#10b981",
  variable: "#f59e0b",
  enum: "#ec4899",
  "type-alias": "#14b8a6",
};

function getColor(kind: string): string {
  return NODE_COLORS[kind] || "#64748b";
}

export function Graph2D({ data, onNodeClick }: Graph2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onNodeClick?.(nodeId);
    },
    [onNodeClick],
  );

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    // Build maps
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

    // Transform edges to D3 format
    const linkData = data.edges.map((e) => ({
      source: e.sourceId,
      target: e.targetId,
      isAccessible: e.isAccessible,
    }));

    // Create node array for simulation
    const simNodes = data.nodes.map((n) => ({ ...n }));

    // Create simulation
    const simulation = d3
      .forceSimulation(simNodes as any)
      .force(
        "link",
        d3
          .forceLink(linkData)
          .id((d: any) => d.id)
          .distance((d: any) => {
            const source = nodeMap.get(d.source.id || d.source);
            const target = nodeMap.get(d.target.id || d.target);
            // File-to-file edges closer; entity edges further
            if (source?.kind === "file" && target?.kind === "file") return 80;
            return 120;
          })
          .strength(0.3),
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => (d.kind === "file" ? 12 : 8)));

    // Create container group with zoom/pan
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Draw edges
    const link = g
      .append("g")
      .selectAll<SVGLineElement, any>("line")
      .data(linkData)
      .join("line")
      .attr("stroke", (d) => (d.isAccessible ? "#334155" : "#7f1d1d"))
      .attr("stroke-width", 1.2)
      .attr("stroke-opacity", (d) => (d.isAccessible ? 0.4 : 0.5))
      .attr("stroke-dasharray", (d) => (d.isAccessible ? "none" : "4,2"));

    // Draw nodes
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any,
      )
      .on("click", (_event, d) => {
        handleNodeClick(d.id);
      });

    // Node circles
    node
      .append("circle")
      .attr("r", (d) => (d.kind === "file" ? 6 : 4))
      .attr("fill", (d) => getColor(d.kind))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1);

    // Node labels (file nodes only, to avoid clutter)
    node
      .filter((d) => d.kind === "file")
      .append("text")
      .text((d) => d.label)
      .attr("x", 8)
      .attr("y", 4)
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-family", "system-ui, sans-serif");

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, handleNodeClick]);

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", background: "#0f0f13" }}
    />
  );
}
