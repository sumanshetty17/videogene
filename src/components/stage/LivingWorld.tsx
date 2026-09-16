import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import type { Group } from "three";

function Lamp({ position }: { position: [number, number, number] }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7) * 0.06;
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
        <meshStandardMaterial color="#2a2e38" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh>
        <coneGeometry args={[0.18, 0.16, 12]} />
        <meshStandardMaterial color="#c9c3b4" roughness={0.45} />
      </mesh>
      <pointLight intensity={1.1} distance={7} color="#ffe7c2" />
    </group>
  );
}

export function LivingWorld({ workshop }: { workshop: boolean }) {
  const haze = useRef<Group>(null);

  useFrame((state) => {
    if (!haze.current) return;
    haze.current.rotation.y = state.clock.elapsedTime * 0.02;
    haze.current.position.y = 1.4 + Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  return (
    <group>
      <color attach="background" args={["#07080c"]} />
      <fog attach="fog" args={["#07080c", 8, 22]} />

      <hemisphereLight args={["#9bb7d4", "#0b0c0f", 0.35]} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={1.35}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.35} color="#7aa4d6" />
      <pointLight position={[0, 3.2, 1.2]} intensity={0.55} color="#2ee6c5" distance={10} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#12151c" roughness={0.9} metalness={0.12} />
      </mesh>
      <gridHelper args={[20, 20, "#1d2430", "#151920"]} position={[0, 0.01, 0]} />

      {workshop && (
        <>
          <mesh position={[-2.6, 0.55, -1.1]} castShadow>
            <boxGeometry args={[1.8, 1.1, 0.8]} />
            <meshStandardMaterial color="#1a1f28" roughness={0.7} />
          </mesh>
          <mesh position={[-2.6, 1.14, -1.1]}>
            <boxGeometry args={[1.85, 0.06, 0.85]} />
            <meshStandardMaterial color="#2a2118" roughness={0.55} />
          </mesh>
          <mesh position={[3.2, 1.6, -2.4]} castShadow>
            <boxGeometry args={[0.18, 3.2, 2.4]} />
            <meshStandardMaterial color="#171b22" roughness={0.8} />
          </mesh>
          <Lamp position={[-0.8, 3.1, 0.4]} />
          <Lamp position={[1.4, 3.2, -0.6]} />
        </>
      )}

      <group ref={haze}>
        <mesh>
          <sphereGeometry args={[4.2, 16, 16]} />
          <meshBasicMaterial color="#2ee6c5" transparent opacity={0.028} />
        </mesh>
      </group>

      <Sparkles
        count={40}
        scale={[10, 4, 10]}
        size={2.2}
        speed={0.35}
        opacity={0.45}
        color="#d7e4ff"
      />
    </group>
  );
}
