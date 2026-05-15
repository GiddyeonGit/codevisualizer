import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { GraphData } from "@/shared/api/types";

interface Graph2DProps {
  data: GraphData;
}

export function Graph2D({ data }: Graph2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Transform edges to D3 format (source/target properties)
    const linkData = data.edges.map((e) => ({
      source: e.sourceId,
      target: e.targetId,
    }));

    // Build force simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        "link",
        d3
          .forceLink(linkData)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // TODO: Render nodes and edges

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", background: "#0f0f13" }}
    />
  );
}
