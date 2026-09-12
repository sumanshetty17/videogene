import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { CharacterAction } from "@/lib/storyboard";

type Props = {
  position: [number, number, number];
  accent: string;
  action: CharacterAction;
  name: string;
  facing?: number;
  talkLevel?: number;
};

export function BoneCharacter({
  position,
  accent,
  action,
  facing = 1,
  talkLevel = 0,
}: Props) {
  const root = useRef<Group>(null);
  const hips = useRef<Group>(null);
  const chest = useRef<Group>(null);
  const head = useRef<Group>(null);
  const jaw = useRef<Mesh>(null);
  const lThigh = useRef<Group>(null);
  const rThigh = useRef<Group>(null);
  const lShin = useRef<Group>(null);
  const rShin = useRef<Group>(null);
  const lArm = useRef<Group>(null);
  const rArm = useRef<Group>(null);
  const lFore = useRef<Group>(null);
  const rFore = useRef<Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.08);
    const t = state.clock.elapsedTime + phase;
    const walk = action === "walk";
    const talk = action === "talk";
    const point = action === "point";
    const look = action === "look" || action === "react";
    const cycle = walk ? t * 6.2 : t * 1.7;

    if (root.current) {
      const bob = walk ? Math.abs(Math.sin(cycle)) * 0.06 : Math.sin(t * 1.3) * 0.012;
      root.current.position.y = bob;
      root.current.rotation.y = facing > 0 ? -0.25 : 0.35;
    }
    if (hips.current) {
      hips.current.position.x = Math.sin(t * 0.55) * (walk ? 0.02 : 0.035);
      hips.current.rotation.z = Math.sin(t * 0.55) * 0.045;
      hips.current.rotation.y = walk ? Math.sin(cycle) * 0.08 : Math.sin(t * 0.4) * 0.04;
    }
    if (chest.current) {
      chest.current.position.y = 0.72 + Math.sin(t * 1.45) * 0.018;
      chest.current.rotation.x = talk ? Math.sin(t * 2.2) * 0.04 : Math.sin(t * 1.1) * 0.02;
    }
    if (head.current) {
      head.current.rotation.x = talk
        ? 0.08 + Math.sin(t * 2.6) * 0.06
        : look
          ? 0.12 + Math.sin(t * 1.5) * 0.05
          : Math.sin(t * 0.9) * 0.03;
      head.current.rotation.y = look ? Math.sin(t * 0.8) * 0.18 : Math.sin(t * 0.5) * 0.06;
    }
    if (jaw.current) {
      const open = talk || talkLevel > 0.1
        ? 0.16 + Math.max(talkLevel, Math.abs(Math.sin(t * 11)) * 0.2)
        : 0.04;
      jaw.current.scale.y += (open - jaw.current.scale.y) * Math.min(1, d * 18);
    }

    const swing = walk ? Math.sin(cycle) : Math.sin(t * 1.2) * 0.08;
    if (lThigh.current) lThigh.current.rotation.x = walk ? swing * 0.7 : 0.08;
    if (rThigh.current) rThigh.current.rotation.x = walk ? -swing * 0.7 : 0.08;
    if (lShin.current)
      lShin.current.rotation.x = walk ? Math.max(0.05, -swing) * 0.7 : 0.12;
    if (rShin.current)
      rShin.current.rotation.x = walk ? Math.max(0.05, swing) * 0.7 : 0.12;

    if (lArm.current) {
      lArm.current.rotation.x = walk ? -swing * 0.55 : talk ? -0.25 : -0.15;
      lArm.current.rotation.z = 0.18;
    }
    if (rArm.current) {
      rArm.current.rotation.z = -0.18;
      rArm.current.rotation.x = point
        ? -1.15
        : talk
          ? -0.45 + Math.sin(t * 3.1) * 0.22
          : walk
            ? swing * 0.55
            : -0.12;
    }
    if (lFore.current) lFore.current.rotation.x = walk ? 0.25 : 0.2;
    if (rFore.current) rFore.current.rotation.x = point ? -0.15 : talk ? 0.35 : 0.22;
  });

  const skin = "#e6c8b0";
  const pants = "#1c222c";

  return (
    <group position={position} ref={root}>
      <group ref={hips}>
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[0.38, 0.18, 0.22]} />
          <meshStandardMaterial color={pants} roughness={0.55} />
        </mesh>

        <group ref={chest} position={[0, 0.72, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.48, 0.26]} />
            <meshStandardMaterial color={accent} roughness={0.4} metalness={0.08} />
          </mesh>
          <group ref={head} position={[0, 0.42, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.16, 18, 16]} />
              <meshStandardMaterial color={skin} roughness={0.55} />
            </mesh>
            <mesh position={[-0.05, 0.04, 0.12]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#16181c" />
            </mesh>
            <mesh position={[0.05, 0.04, 0.12]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#16181c" />
            </mesh>
            <mesh ref={jaw} position={[0, -0.04, 0.12]}>
              <boxGeometry args={[0.07, 0.03, 0.03]} />
              <meshStandardMaterial color="#3a2a28" />
            </mesh>
          </group>

          <group ref={lArm} position={[-0.28, 0.16, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.22, 6, 10]} />
              <meshStandardMaterial color={accent} roughness={0.45} />
            </mesh>
            <group ref={lFore} position={[0, -0.32, 0]}>
              <mesh position={[0, -0.12, 0]} castShadow>
                <capsuleGeometry args={[0.045, 0.18, 6, 10]} />
                <meshStandardMaterial color={skin} roughness={0.55} />
              </mesh>
            </group>
          </group>
          <group ref={rArm} position={[0.28, 0.16, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.22, 6, 10]} />
              <meshStandardMaterial color={accent} roughness={0.45} />
            </mesh>
            <group ref={rFore} position={[0, -0.32, 0]}>
              <mesh position={[0, -0.12, 0]} castShadow>
                <capsuleGeometry args={[0.045, 0.18, 6, 10]} />
                <meshStandardMaterial color={skin} roughness={0.55} />
              </mesh>
            </group>
          </group>
        </group>

        <group ref={lThigh} position={[-0.12, 0.42, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.22, 6, 10]} />
            <meshStandardMaterial color={pants} roughness={0.55} />
          </mesh>
          <group ref={lShin} position={[0, -0.36, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <capsuleGeometry args={[0.05, 0.2, 6, 10]} />
              <meshStandardMaterial color={pants} roughness={0.55} />
            </mesh>
            <mesh position={[0, -0.3, 0.04]} castShadow>
              <boxGeometry args={[0.12, 0.05, 0.2]} />
              <meshStandardMaterial color="#111318" roughness={0.7} />
            </mesh>
          </group>
        </group>
        <group ref={rThigh} position={[0.12, 0.42, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.22, 6, 10]} />
            <meshStandardMaterial color={pants} roughness={0.55} />
          </mesh>
          <group ref={rShin} position={[0, -0.36, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <capsuleGeometry args={[0.05, 0.2, 6, 10]} />
              <meshStandardMaterial color={pants} roughness={0.55} />
            </mesh>
            <mesh position={[0, -0.3, 0.04]} castShadow>
              <boxGeometry args={[0.12, 0.05, 0.2]} />
              <meshStandardMaterial color="#111318" roughness={0.7} />
            </mesh>
          </group>
        </group>
      </group>
      <mesh position={[0, 2.02, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}
