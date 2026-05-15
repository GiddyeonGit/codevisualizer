import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { GraphData, GraphNode, LayoutMode } from "@/shared/api/types";

interface Graph3DProps {
  data: GraphData;
  layout: LayoutMode;
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

const NODE_RADIUS: Record<string, number> = {
  file: 0.5,
  class: 0.35,
  interface: 0.3,
  function: 0.25,
  variable: 0.2,
  enum: 0.25,
  "type-alias": 0.2,
};

function getNodeColor(kind: string): string {
  return NODE_COLORS[kind] || "#64748b";
}

function getNodeRadius(kind: string): number {
  return NODE_RADIUS[kind] || 0.25;
}

function computePositions(
  nodes: GraphNode[],
  layout: LayoutMode,
): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  const count = nodes.length;

  if (count === 0) return positions;

  switch (layout) {
    case "spherical": {
      const radius = Math.max(6, count * 0.8);
      nodes.forEach((node, i) => {
        const phi = Math.acos(-1 + (2 * i + 1) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        positions.set(node.id, [
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi),
        ]);
      });
      break;
    }
    case "concentric": {
      const layers = Math.ceil(Math.sqrt(count));
      const perLayer = Math.ceil(count / layers);
      nodes.forEach((node, i) => {
        const layer = Math.floor(i / perLayer);
        const indexInLayer = i % perLayer;
        const angle = (indexInLayer / perLayer) * Math.PI * 2;
        const r = (layer + 1) * 2.5;
        // File nodes on outer rings, entities on inner
        const adjustedLayer = node.kind === "file" ? layer + 1 : layer;
        const adjustedR = (adjustedLayer + 1) * 2;
        positions.set(node.id, [
          adjustedR * Math.cos(angle),
          (layer - layers / 2) * 2,
          adjustedR * Math.sin(angle),
        ]);
      });
      break;
    }
    case "force-directed":
    default: {
      // Simple spherical fallback for initial render
      const radius = Math.max(6, count * 0.8);
      nodes.forEach((node, i) => {
        const phi = Math.acos(-1 + (2 * i + 1) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        positions.set(node.id, [
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi),
        ]);
      });
      break;
    }
  }

  return positions;
}

export function Graph3D({ data, layout }: Graph3DProps) {
  const positions = useMemo(
    () => computePositions(data.nodes, layout),
    [data.nodes, layout],
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 60 }}
      style={{ width: "100%", height: "100%", background: "#0f0f13" }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} />
      <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.5} />
      <GraphEdges edges={data.edges} positions={positions} />
      <GraphNodes nodes={data.nodes} positions={positions} />
    </Canvas>
  );
}

function SphereNode({
  node,
  position,
}: {
  node: GraphNode;
  position: [number, number, number];
}) {
  const color = getNodeColor(node.kind);
  const radius = getNodeRadius(node.kind);

  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

function GraphNodes({
  nodes,
  positions,
}: {
  nodes: GraphNode[];
  positions: Map<string, [number, number, number]>;
}) {
  return (
    <group>
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        return <SphereNode key={node.id} node={node} position={pos} />;
      })}
    </group>
  );
}

function GraphEdges({
  edges,
  positions,
}: {
  edges: GraphData["edges"];
  positions: Map<string, [number, number, number]>;
}) {
  const lines = useMemo(() => {
    const result: { points: THREE.Vector3[]; accessible: boolean }[] = [];
    for (const edge of edges) {
      const sourcePos = positions.get(edge.sourceId);
      const targetPos = positions.get(edge.targetId);
      if (!sourcePos || !targetPos) continue;
      result.push({
        points: [
          new THREE.Vector3(...sourcePos),
          new THREE.Vector3(...targetPos),
        ],
        accessible: edge.isAccessible,
      });
    }
    return result;
  }, [edges, positions]);

  return (
    <group>
      {lines.map((line, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                line.points[0].x, line.points[0].y, line.points[0].z,
                line.points[1].x, line.points[1].y, line.points[1].z,
              ]), 3]}
              count={2}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={line.accessible ? "#334155" : "#7f1d1d"}
            opacity={line.accessible ? 0.3 : 0.5}
            transparent
          />
        </line>
      ))}
    </group>
  );
}
