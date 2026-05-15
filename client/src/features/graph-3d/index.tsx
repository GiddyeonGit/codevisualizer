import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { GraphData, LayoutMode } from "@/shared/api/types";

interface Graph3DProps {
  data: GraphData;
  layout: LayoutMode;
}

export function Graph3D({ data, layout }: Graph3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 60 }}
      style={{ width: "100%", height: "100%", background: "#0f0f13" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableDamping dampingFactor={0.05} />
      {/* TODO: Render graph nodes as spheres with edges as lines */}
      <GraphNodes nodes={data.nodes} layout={layout} />
      <GraphEdges edges={data.edges} nodes={data.nodes} layout={layout} />
    </Canvas>
  );
}

function GraphNodes({ nodes, layout }: { nodes: GraphData["nodes"]; layout: LayoutMode }) {
  // TODO: implement node rendering based on layout
  return null;
}

function GraphEdges({
  edges,
  nodes,
  layout,
}: {
  edges: GraphData["edges"];
  nodes: GraphData["nodes"];
  layout: LayoutMode;
}) {
  // TODO: implement edge rendering
  return null;
}
