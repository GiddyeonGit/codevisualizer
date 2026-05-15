import { useRef, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useInteractionStore } from "@/entities/interaction-store";

const NODE_RADIUS: Record<string, number> = {
  file: 0.6,
  class: 0.8,
  interface: 0.7,
  function: 0.5,
  variable: 0.4,
  enum: 0.6,
  "type-alias": 0.5,
};

const LERP_RATE = 0.08;
const LERP_THRESHOLD = 0.01;

function isTraceModifier(e: React.MouseEvent | MouseEvent | PointerEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

function computePositions(
  nodes: { id: string; kind: string }[],
  layout: string,
): Map<string, THREE.Vector3> {
  const positions = new Map<string, THREE.Vector3>();
  const N = nodes.length;
  if (N === 0) return positions;

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  if (layout === "spherical") {
    const R = 12;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1 || 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      positions.set(
        nodes[i].id,
        new THREE.Vector3(
          R * radiusAtY * Math.cos(theta),
          R * y,
          R * radiusAtY * Math.sin(theta),
        ),
      );
    }
  } else if (layout === "concentric") {
    const kindOrder = ["class", "interface", "enum", "type-alias", "function", "variable", "file"];
    const ringRadii = [4, 6, 8, 11];
    const grouped = new Map<string, typeof nodes>();
    for (const k of kindOrder) grouped.set(k, []);
    for (const n of nodes) {
      const list = grouped.get(n.kind);
      if (list) list.push(n);
      else grouped.get("file")!.push(n);
    }
    let ringIndex = 0;
    for (const k of kindOrder) {
      const group = grouped.get(k)!;
      if (group.length === 0) continue;
      const ring = ringRadii[Math.min(ringIndex, ringRadii.length - 1)];
      for (let i = 0; i < group.length; i++) {
        const theta = (2 * Math.PI * i) / group.length;
        positions.set(
          group[i].id,
          new THREE.Vector3(ring * Math.cos(theta), 0, ring * Math.sin(theta)),
        );
      }
      ringIndex++;
    }
  } else {
    // force-directed -- spherical fallback
    const R = 12;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1 || 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      positions.set(
        nodes[i].id,
        new THREE.Vector3(
          R * radiusAtY * Math.cos(theta),
          R * y,
          R * radiusAtY * Math.sin(theta),
        ),
      );
    }
  }

  return positions;
}

function SphereNode({
  node,
  targetPos,
  selected,
  isTraceNode,
  traceRole,
  isHovered,
  getColor,
}: {
  node: { id: string; kind: string };
  targetPos: THREE.Vector3;
  selected: boolean;
  isTraceNode: boolean;
  traceRole: "source" | "target" | "intermediate" | null;
  isHovered: boolean;
  getColor: (kind: string) => string;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const store = useInteractionStore;

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = meshRef.current.position;
    if (pos.distanceToSquared(targetPos) > LERP_THRESHOLD) {
      pos.lerp(targetPos, LERP_RATE);
    } else {
      pos.copy(targetPos);
    }
  });

  const color = getColor(node.kind);
  const radius = NODE_RADIUS[node.kind] || 0.5;
  const isSelectedOrHovered = selected || isHovered;
  const scale = isSelectedOrHovered ? 1.3 : isTraceNode ? 1.2 : 1;

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        e.stopPropagation();
        if (isTraceModifier(e.nativeEvent as unknown as React.MouseEvent)) {
          (e.nativeEvent as MouseEvent).preventDefault();
          store.getState().toggleTraceSource(node.id);
        } else {
          store.getState().selectNode(node.id);
        }
      }}
      onPointerEnter={() => store.getState().setHoveredNode(node.id)}
      onPointerLeave={() => store.getState().setHoveredNode(null)}
    >
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial
        color={isTraceNode && traceRole === "source" ? "#fbbf24" : isTraceNode && traceRole === "target" ? "#34d399" : color}
        emissive={isSelectedOrHovered ? color : isTraceNode ? "#60a5fa" : "#000000"}
        emissiveIntensity={isTraceNode ? 0.6 : isSelectedOrHovered ? 0.3 : 0}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

function GraphNodes({
  nodes,
  targetPositions,
  selectedNodeId,
  traceNodeSet,
  tracePath,
  hoveredNodeId,
  getColor,
}: {
  nodes: { id: string; kind: string; label: string }[];
  targetPositions: Map<string, THREE.Vector3>;
  selectedNodeId: string | null;
  traceNodeSet: Set<string>;
  tracePath: { nodeIds: string[] } | null;
  hoveredNodeId: string | null;
  getColor: (kind: string) => string;
}) {
  return (
    <>
      {nodes.map((node) => {
        const targetPos = targetPositions.get(node.id) || new THREE.Vector3(0, 0, 0);
        const isTraceNode = traceNodeSet.has(node.id);
        let traceRole: "source" | "target" | "intermediate" | null = null;
        if (isTraceNode && tracePath) {
          if (tracePath.nodeIds[0] === node.id) traceRole = "source";
          else if (tracePath.nodeIds[tracePath.nodeIds.length - 1] === node.id) traceRole = "target";
          else traceRole = "intermediate";
        }
        return (
          <SphereNode
            key={node.id}
            node={node}
            targetPos={targetPos}
            selected={selectedNodeId === node.id}
            isTraceNode={isTraceNode}
            traceRole={traceRole}
            isHovered={hoveredNodeId === node.id}
            getColor={getColor}
          />
        );
      })}
    </>
  );
}

function GraphEdges({
  edges,
  nodePositionsRef,
  traceEdgeSet,
  colors,
}: {
  edges: { id: string; sourceId: string; targetId: string; isAccessible: boolean }[];
  nodePositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  traceEdgeSet: Set<string>;
  colors: { edge: string; edgeInaccessible: string; tracePath: string };
}) {
  const linesRef = useRef<(THREE.Line | null)[]>([]);
  const geomRef = useRef<(THREE.BufferGeometry | null)[]>([]);
  const edgeCountRef = useRef(edges.length);

  // Reset ref arrays if edge count changes
  if (edgeCountRef.current !== edges.length) {
    linesRef.current = [];
    geomRef.current = [];
    edgeCountRef.current = edges.length;
  }

  useFrame(() => {
    for (let i = 0; i < edges.length; i++) {
      const line = linesRef.current[i];
      const geom = geomRef.current[i];
      if (!line || !geom) continue;
      const sourcePos = nodePositionsRef.current.get(edges[i].sourceId);
      const targetPos = nodePositionsRef.current.get(edges[i].targetId);
      if (sourcePos && targetPos) {
        const posAttr = geom.attributes.position;
        if (posAttr) {
          const array = posAttr.array as Float32Array;
          array[0] = sourcePos.x;
          array[1] = sourcePos.y;
          array[2] = sourcePos.z;
          array[3] = targetPos.x;
          array[4] = targetPos.y;
          array[5] = targetPos.z;
          posAttr.needsUpdate = true;
        }
      }
    }
  });

  return (
    <>
      {edges.map((edge, i) => {
        const isTrace = traceEdgeSet.has(edge.id);
        const color = isTrace
          ? colors.tracePath
          : edge.isAccessible
            ? colors.edge
            : colors.edgeInaccessible;
        const opacity = isTrace ? 1 : edge.isAccessible ? 0.6 : 0.3;

        const positions = new Float32Array(6);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geomRef.current[i] = geometry;

        return (
          <lineSegments key={edge.id} ref={(el) => { linesRef.current[i] = el?.children[0] as THREE.Line || null; }}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[positions, 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color={color} transparent opacity={opacity} />
          </lineSegments>
        );
      })}
    </>
  );
}

function TracerDot({
  tracePath,
  targetPositions,
}: {
  tracePath: { nodeIds: string[] } | null;
  targetPositions: Map<string, THREE.Vector3>;
}) {
  const dotRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(0);

  useFrame(() => {
    if (!tracePath || tracePath.nodeIds.length < 2) return;
    const positions = tracePath.nodeIds
      .map((id) => targetPositions.get(id))
      .filter((p): p is THREE.Vector3 => !!p);
    if (positions.length < 2) return;

    const totalSegments = positions.length - 1;
    let totalLength = 0;
    for (let i = 0; i < totalSegments; i++) {
      totalLength += positions[i].distanceTo(positions[i + 1]);
    }
    if (totalLength === 0) return;

    const rawProgress = progressRef.current;
    let accumulated = 0;
    const targetDist = rawProgress * totalLength;

    for (let i = 0; i < totalSegments; i++) {
      const segLen = positions[i].distanceTo(positions[i + 1]);
      if (accumulated + segLen >= targetDist) {
        const t = (targetDist - accumulated) / segLen;
        if (dotRef.current) {
          dotRef.current.position.lerpVectors(positions[i], positions[i + 1], t);
        }
        break;
      }
      accumulated += segLen;
    }

    progressRef.current += 0.005;
    if (progressRef.current > 1) progressRef.current = 0;
  });

  return (
    <mesh ref={dotRef} visible={!!tracePath && tracePath.nodeIds.length >= 2}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
    </mesh>
  );
}

function CameraController() {
  const { camera } = useThree();
  const store = useInteractionStore;

  const flyToNode = useCallback(
    (_nodeId: string): boolean => {
      // Simplified camera control -- future enhancement for precise fly-to
      return true;
    },
    [camera, store],
  );

  useEffect(() => {
    store.getState().registerZoomToNode(flyToNode);
    return () => {
      store.getState().registerZoomToNode(null);
    };
  }, [flyToNode, store]);

  return null;
}

export function Graph3D() {
  const graphData = useInteractionStore((s) => s.graphData);
  const layoutMode = useInteractionStore((s) => s.layoutMode);
  const selectedNodeId = useInteractionStore((s) => s.selectedNodeId);
  const hoveredNodeId = useInteractionStore((s) => s.hoveredNodeId);
  const tracePath = useInteractionStore((s) => s.tracePath);
  const colors = useInteractionStore((s) => s.colors);

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  const targetPositions = useMemo(
    () => computePositions(nodes, layoutMode),
    [nodes, layoutMode],
  );

  const nodePositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());
  nodePositionsRef.current = targetPositions;

  const traceNodeSet = useMemo(() => {
    return new Set(tracePath?.nodeIds || []);
  }, [tracePath]);

  const traceEdgeSet = useMemo(() => {
    return new Set(tracePath?.edgeIds || []);
  }, [tracePath]);

  const getColor = useCallback(
    (kind: string): string => {
      return colors.node[kind] || colors.nodeDefault;
    },
    [colors],
  );

  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ position: [15, 10, 15], fov: 50 }}
      onPointerMissed={() => {
        useInteractionStore.getState().selectNode(null);
        useInteractionStore.getState().setHoveredNode(null);
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
      />
      <CameraController />
      <GraphEdges
        edges={edges}
        nodePositionsRef={nodePositionsRef}
        traceEdgeSet={traceEdgeSet}
        colors={colors}
      />
      <GraphNodes
        nodes={nodes}
        targetPositions={targetPositions}
        selectedNodeId={selectedNodeId}
        traceNodeSet={traceNodeSet}
        tracePath={tracePath}
        hoveredNodeId={hoveredNodeId}
        getColor={getColor}
      />
      <TracerDot tracePath={tracePath} targetPositions={targetPositions} />
    </Canvas>
  );
}
