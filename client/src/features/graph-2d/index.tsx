import { useRef, useMemo, useEffect, useCallback } from "react";
import * as d3 from "d3";
import { useInteractionStore } from "@/entities/interaction-store";
import type { GraphNode, GraphEdge, GraphData } from "@/shared/api/types";

function compute2DPositions(
  nodes: GraphNode[],
  layout: "spherical" | "concentric",
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) * 0.4;

  if (nodes.length === 0) return positions;

  if (layout === "spherical") {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const N = nodes.length;
    for (let i = 0; i < N; i++) {
      const radius = R * Math.sqrt(i / N);
      const theta = i * goldenAngle;
      positions.set(nodes[i].id, {
        x: cx + radius * Math.cos(theta),
        y: cy + radius * Math.sin(theta),
      });
    }
  } else if (layout === "concentric") {
    const entityKinds = new Set(["class", "interface", "function", "variable", "enum", "type-alias"]);
    const sorted = [...nodes].sort((a, b) => {
      const aIsEntity = entityKinds.has(a.kind) ? 0 : 1;
      const bIsEntity = entityKinds.has(b.kind) ? 0 : 1;
      return aIsEntity - bIsEntity;
    });
    const N = sorted.length;
    const rings = Math.max(1, Math.ceil(Math.sqrt(N)));
    const perRing = Math.max(1, Math.ceil(N / rings));
    const ringSpacing = R / rings;
    for (let i = 0; i < N; i++) {
      const ringIdx = Math.floor(i / perRing);
      const inRing = i % perRing;
      const ringRadius = (ringIdx + 1) * ringSpacing;
      const angleStep = (2 * Math.PI) / Math.max(1, perRing);
      const theta = inRing * angleStep;
      positions.set(sorted[i].id, {
        x: cx + ringRadius * Math.cos(theta),
        y: cy + ringRadius * Math.sin(theta),
      });
    }
  }

  return positions;
}

export function Graph2D() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>> | null>(null);
  const nodesRef = useRef<any[]>([]);
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const containerSize = useRef({ width: 800, height: 600 });

  const graphData = useInteractionStore((s) => s.graphData);
  const layoutMode = useInteractionStore((s) => s.layoutMode);
  const selectedNodeId = useInteractionStore((s) => s.selectedNodeId);
  const hoveredNodeId = useInteractionStore((s) => s.hoveredNodeId);
  const tracePath = useInteractionStore((s) => s.tracePath);
  const traceSourceId = useInteractionStore((s) => s.traceSourceId);
  const colors = useInteractionStore((s) => s.colors);
  const store = useInteractionStore;

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  const traceNodeSet = useMemo(() => new Set(tracePath?.nodeIds || []), [tracePath]);
  const traceEdgeSet = useMemo(() => new Set(tracePath?.edgeIds || []), [tracePath]);

  const getColor = useCallback(
    (kind: string): string => colors?.node?.[kind] || colors?.nodeDefault || "#888",
    [colors],
  );

  const flyToNode = useCallback(
    (nodeId: string) => {
      const svg = svgRef.current;
      if (!svg) return false;
      const pos = nodePositionsRef.current.get(nodeId);
      if (!pos) return false;
      const { width, height } = containerSize.current;
      const scale = 2;
      const tx = -pos.x * scale + width / 2;
      const ty = -pos.y * scale + height / 2;
      d3.select(svg)
        .transition()
        .duration(500)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform as any,
          d3.zoomIdentity.translate(tx, ty).scale(scale),
        );
      return true;
    },
    [],
  );

  useEffect(() => {
    store.getState().registerZoomToNode(flyToNode ? ((id: string) => flyToNode(id)) : null);
    return () => {
      store.getState().registerZoomToNode(null);
    };
  }, [flyToNode, store]);

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const { width, height } = container.getBoundingClientRect();
    containerSize.current = { width, height };

    const svgSel = d3.select(svg);
    svgSel.selectAll("*").remove();

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        containerGroup.attr("transform", event.transform);
      });

    svgSel.call(zoom);

    const containerGroup = svgSel.append("g");

    if (!graphData) return;

    // Compute layout positions for spherical / concentric modes
    if (layoutMode === "spherical" || layoutMode === "concentric") {
      const positions = compute2DPositions(nodes, layoutMode, width, height);
      nodePositionsRef.current = positions;

      // Stop force simulation if running
      if (simRef.current) {
        simRef.current.stop();
        simRef.current = null;
      }

      // --- Edges ---
      const edgeSel = containerGroup
        .selectAll<SVGLineElement, any>("line")
        .data(edges, (d: any) => d.id)
        .join("line")
        .attr("stroke", (d: any) => getColor(d.kind))
        .attr("stroke-opacity", (d: any) => traceEdgeSet.has(d.id) ? 0.9 : 0.2)
        .attr("stroke-width", (d: any) => traceEdgeSet.has(d.id) ? 3 : 1);

      // --- Nodes ---
      const nodeSel = containerGroup
        .selectAll<SVGCircleElement, any>("circle")
        .data(nodes, (d: any) => d.id)
        .join("circle")
        .attr("r", (d: any) => traceSourceId === d.id || traceNodeSet.has(d.id) ? 8 : 5)
        .attr("fill", (d: any) => {
          if (traceSourceId === d.id) return "#ff0";
          if (traceNodeSet.has(d.id)) return "#f80";
          return selectedNodeId === d.id ? "#fff" : getColor(d.kind);
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", (d: any) => selectedNodeId === d.id ? 2 : 1)
        .on("click", (_event: any, d: any) => {
          const event = _event as MouseEvent;
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            store.getState().toggleTraceSource(d.id);
          } else {
            store.getState().selectNode(d.id);
          }
        })
        .on("mouseenter", (_event: any, d: any) => {
          store.getState().setHoveredNode(d.id);
          d3.select(_event.currentTarget).transition().duration(200).attr("r", 8);
        })
        .on("mouseleave", (_event: any, d: any) => {
          store.getState().setHoveredNode(null);
          d3.select(_event.currentTarget).transition().duration(200).attr("r", traceSourceId === d.id || traceNodeSet.has(d.id) ? 8 : 5);
        })
        .call(d3.drag<SVGCircleElement, any>()
          .on("start", (event, d) => {
            if (!event.active && simRef.current) simRef.current.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active && simRef.current) simRef.current.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any);

      // Animate to positions
      nodeSel
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr("cx", (d: any) => positions.get(d.id)?.x ?? width / 2)
        .attr("cy", (d: any) => positions.get(d.id)?.y ?? height / 2);

      edgeSel
        .transition()
        .duration(600)
        .attr("x1", (d: any) => positions.get(d.sourceId)?.x ?? width / 2)
        .attr("y1", (d: any) => positions.get(d.sourceId)?.y ?? height / 2)
        .attr("x2", (d: any) => positions.get(d.targetId)?.x ?? width / 2)
        .attr("y2", (d: any) => positions.get(d.targetId)?.y ?? height / 2);

      // --- Labels (file nodes only) ---
      containerGroup
        .selectAll<SVGTextElement, any>("text")
        .data(nodes.filter((n: any) => n.kind === "file"), (d: any) => d.id)
        .join("text")
        .text((d: any) => d.label)
        .attr("fill", "#aaa")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .attr("dy", -8)
        .transition()
        .duration(600)
        .attr("x", (d: any) => positions.get(d.id)?.x ?? width / 2)
        .attr("y", (d: any) => positions.get(d.id)?.y ?? height / 2);

      // --- Tracer dot ---
      if (tracePath && tracePath.nodeIds.length > 1) {
        const traceNodes = tracePath.nodeIds.map((nid) => {
          const pos = positions.get(nid);
          return pos ? [pos.x, pos.y] : null;
        }).filter(Boolean) as [number, number][];

        if (traceNodes.length > 0) {
          const tracer = containerGroup.append("circle")
            .attr("r", 4)
            .attr("fill", "#ff0")
            .attr("opacity", 0.9);

          let step = 0;
          const segmentDuration = 600;
          d3.timer(() => {
            const totalDuration = segmentDuration * (traceNodes.length - 1);
            const elapsed = Date.now() % totalDuration;
            step = Math.floor(elapsed / segmentDuration);
            const from = traceNodes[step];
            const next = Math.min(step + 1, traceNodes.length - 1);
            const to = traceNodes[next];
            if (from && to) {
              const t = (elapsed % segmentDuration) / segmentDuration;
              tracer
                .attr("cx", from[0] + (to[0] - from[0]) * t)
                .attr("cy", from[1] + (to[1] - from[1]) * t);
            }
          });
        }
      }
    }

    // --- Force-directed layout ---
    if (layoutMode === "force-directed" && nodes.length > 0) {
      const simNodes = nodes.map((n: any) => ({ ...n }));
      const simLinks = edges.map((e: any) => ({ ...e }));

      const simulation = d3.forceSimulation(simNodes)
        .force("link", d3.forceLink(simLinks).id((d: any) => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(10))
        .alphaDecay(0.02);

      simRef.current = simulation;
      nodesRef.current = simNodes;

      // --- Edges ---
      const edgeSel = containerGroup
        .selectAll<SVGLineElement, any>("line")
        .data(simLinks, (d: any) => d.id)
        .join("line")
        .attr("stroke", (d: any) => getColor(d.kind))
        .attr("stroke-opacity", (d: any) => traceEdgeSet.has(d.id) ? 0.9 : 0.2)
        .attr("stroke-width", (d: any) => traceEdgeSet.has(d.id) ? 3 : 1);

      // --- Nodes ---
      const nodeSel = containerGroup
        .selectAll<SVGCircleElement, any>("circle")
        .data(simNodes, (d: any) => d.id)
        .join("circle")
        .attr("r", (d: any) => traceSourceId === d.id || traceNodeSet.has(d.id) ? 8 : 5)
        .attr("fill", (d: any) => {
          if (traceSourceId === d.id) return "#ff0";
          if (traceNodeSet.has(d.id)) return "#f80";
          return selectedNodeId === d.id ? "#fff" : getColor(d.kind);
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", (d: any) => selectedNodeId === d.id ? 2 : 1)
        .on("click", (_event: any, d: any) => {
          const event = _event as MouseEvent;
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            store.getState().toggleTraceSource(d.id);
          } else {
            store.getState().selectNode(d.id);
          }
        })
        .on("mouseenter", (_event: any, d: any) => {
          store.getState().setHoveredNode(d.id);
          d3.select(_event.currentTarget).transition().duration(200).attr("r", 8);
        })
        .on("mouseleave", (_event: any, d: any) => {
          store.getState().setHoveredNode(null);
          d3.select(_event.currentTarget).transition().duration(200).attr("r", traceSourceId === d.id || traceNodeSet.has(d.id) ? 8 : 5);
        })
        .call(d3.drag<SVGCircleElement, any>()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any);

      // --- Labels ---
      containerGroup
        .selectAll<SVGTextElement, any>("text")
        .data(simNodes.filter((n: any) => n.kind === "file"), (d: any) => d.id)
        .join("text")
        .text((d: any) => d.label)
        .attr("fill", "#aaa")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .attr("dy", -8);

      // Tick handler
      simulation.on("tick", () => {
        nodeSel
          .attr("cx", (d: any) => d.x)
          .attr("cy", (d: any) => d.y);

        edgeSel
          .attr("x1", (d: any) => d.source ? (d.source.x ?? width / 2) : width / 2)
          .attr("y1", (d: any) => d.source ? (d.source.y ?? height / 2) : height / 2)
          .attr("x2", (d: any) => d.target ? (d.target.x ?? width / 2) : width / 2)
          .attr("y2", (d: any) => d.target ? (d.target.y ?? height / 2) : height / 2);

        containerGroup.selectAll<SVGTextElement, any>("text")
          .attr("x", (d: any) => d.x)
          .attr("y", (d: any) => d.y);

        // Update node positions ref for zoomToNode
        simNodes.forEach((n: any) => {
          if (n.id) nodePositionsRef.current.set(n.id, { x: n.x, y: n.y });
        });
      });

      return () => {
        simulation.stop();
        simRef.current = null;
      };
    }
  }, [graphData, layoutMode, colors, selectedNodeId, hoveredNodeId, tracePath, traceSourceId, traceNodeSet, traceEdgeSet, getColor, store, nodes, edges, flyToNode]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}
