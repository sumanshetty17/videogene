import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import type { Group } from "three";
import type { WorldKind } from "@/lib/storyboard";

function Hut({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.4, 1.1, 1.1]} />
        <meshStandardMaterial color="#6b4a32" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.15, 0.7, 4]} />
        <meshStandardMaterial color="#3d2a1d" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.4, 6]} />
        <meshStandardMaterial color="#3a2a1c" />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[0.55, 1.3, 7]} />
        <meshStandardMaterial color="#1d3a24" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Fire({ intensity }: { intensity: number }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const s = 0.7 + Math.sin(state.clock.elapsedTime * 11) * 0.15 * (0.4 + intensity);
    ref.current.scale.setScalar(s);
  });
  return (
    <group ref={ref} position={[0.2, 0.2, 0.4]}>
      <mesh>
        <coneGeometry args={[0.18, 0.5, 6]} />
        <meshStandardMaterial
          color="#ff6a1a"
          emissive="#ff3b00"
          emissiveIntensity={1.4 + intensity}
          toneMapped={false}
        />
      </mesh>
      <pointLight intensity={1.6 + intensity * 2} color="#ff7a2a" distance={8} />
    </group>
  );
}

export function StoryWorld({
  world,
  intensity,
}: {
  world: WorldKind;
  intensity: number;
}) {
  const battle = world === "battlefield" || world === "night";
  const village = world === "village" || world === "night" || world === "battlefield";
  const sky = battle ? "#140806" : "#0c1410";
  const fog = battle ? "#2a120c" : "#152018";

  return (
    <group>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fog, 7, 24]} />
      <hemisphereLight args={[battle ? "#ff8a4a" : "#b7d4c4", "#1a100c", 0.4]} />
      <directionalLight
        position={[6, 8, 3]}
        intensity={battle ? 0.55 : 0.9}
        color={battle ? "#ffb078" : "#fff1cc"}
        castShadow
      />
      <directionalLight position={[-4, 3, -5]} intensity={0.25} color="#4a6a88" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={battle ? "#2a1a12" : "#2c3a28"} roughness={0.95} />
      </mesh>

      {village ? (
        <>
          <Hut position={[-3.4, 0, -2.2]} />
          <Hut position={[-1.2, 0, -3.4]} />
          <Hut position={[2.6, 0, -2.8]} />
          <Hut position={[4.2, 0, -1.2]} />
          <Tree position={[-5.2, 0, -1]} />
          <Tree position={[-4.4, 0, 2.2]} />
          <Tree position={[5.4, 0, -3]} />
          <Tree position={[4.6, 0, 2.6]} />
          <Tree position={[-2, 0, 3.4]} />
          <Fire intensity={intensity} />
        </>
      ) : null}

      {battle ? (
        <Sparkles
          count={40}
          scale={[10, 4, 8]}
          size={3}
          speed={1.4}
          color="#ffb070"
          opacity={0.55}
        />
      ) : (
        <Sparkles count={18} scale={[12, 5, 10]} size={2} speed={0.3} color="#d7e6c8" />
      )}
    </group>
  );
}
