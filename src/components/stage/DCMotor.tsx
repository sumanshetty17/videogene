import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { MotorMoments } from "@/components/stage/MotorMoments";

type Props = {
  explode: number;
  spin: boolean;
  focus: string | null;
  position?: [number, number, number];
};

function glow(active: boolean) {
  return {
    emissive: active ? "#2ee6c5" : "#000000",
    emissiveIntensity: active ? 0.7 : 0,
  };
}

/** Real brushed DC motor, exploded along +X (right). */
export function DCMotor({
  explode,
  spin,
  focus,
  position = [0, 1.05, 0],
}: Props) {
  const rotor = useRef<Group>(null);
  const e = explode;

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.08);
    if (!rotor.current) return;
    if (spin) rotor.current.rotation.x += (2.3 + e) * d;
  });

  const gH = glow(focus === "housing");
  const gM = glow(focus === "magnets" || focus === "field");
  const gA = glow(focus === "armature");
  const gC = glow(focus === "commutator");
  const gB = glow(focus === "brushes");
  const gS = glow(focus === "shaft");

  return (
    <group position={position} rotation={[0, 0, -Math.PI / 2]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.02]} receiveShadow>
        <circleGeometry args={[2.4, 48]} />
        <meshStandardMaterial color="#0c1016" metalness={0.88} roughness={0.26} />
      </mesh>

      {/* Rear end bell */}
      <group position={[0, -0.72 - 1.15 * e, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.82, 0.82, 0.12, 36]} />
          <meshStandardMaterial color="#c5ccd4" metalness={0.78} roughness={0.28} {...gH} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 0.1, 20]} />
          <meshStandardMaterial color="#9aa3ae" metalness={0.82} roughness={0.22} />
        </mesh>
        {/* + / − terminals — where DC supply actually enters */}
        {[
          { x: 0.28, color: "#b42318" },
          { x: -0.28, color: "#1c1c1c" },
        ].map((t) => (
          <group key={t.color} position={[t.x, -0.18, 0]}>
            <mesh>
              <cylinderGeometry args={[0.035, 0.035, 0.16, 10]} />
              <meshStandardMaterial color={t.color} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Stator housing (drawn steel can) */}
      <group position={[0, 0, 0]} scale={focus === "housing" ? 1.06 : 1}>
        <mesh castShadow>
          <cylinderGeometry args={[0.8, 0.8, 1.28, 48, 1, true]} />
          <meshStandardMaterial
            color="#b7bec6"
            metalness={0.86}
            roughness={0.22}
            side={THREE.DoubleSide}
            transparent
            opacity={0.92 - e * 0.15}
            {...gH}
          />
        </mesh>
        {[-0.64, 0.64].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.82, 0.82, 0.06, 40]} />
            <meshStandardMaterial color="#9aa3ae" metalness={0.84} roughness={0.24} />
          </mesh>
        ))}
      </group>

      {/* Ferrite arc magnets — curved tiles, ceramic body */}
      <group>
        <mesh
          position={[-0.02, 0, 0]}
          rotation={[0, 0.08 * e, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.68, 0.68, 1.02, 28, 1, false, Math.PI * 0.15, Math.PI * 0.7]} />
          <meshStandardMaterial
            color="#4a433c"
            metalness={0.08}
            roughness={0.72}
            {...gM}
          />
        </mesh>
        <mesh position={[0.02, 0, 0]} rotation={[0, Math.PI + 0.08 * e, 0]} castShadow>
          <cylinderGeometry args={[0.68, 0.68, 1.02, 28, 1, false, Math.PI * 0.15, Math.PI * 0.7]} />
          <meshStandardMaterial
            color="#4a433c"
            metalness={0.08}
            roughness={0.72}
            {...gM}
          />
        </mesh>
        {/* N / S paint marks like factory magnets */}
        <mesh position={[0.66 + 0.55 * e, 0, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.12]} />
          <meshStandardMaterial color="#8b1e1e" roughness={0.5} {...gM} />
        </mesh>
        <mesh position={[-0.66 - 0.55 * e, 0, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.12]} />
          <meshStandardMaterial color="#1e4a8b" roughness={0.5} {...gM} />
        </mesh>
      </group>

      {/* Rotor group: shaft + laminations + windings + commutator */}
      <group ref={rotor}>
        {/* Laminated armature stack */}
        <group position={[0, 0.15 + 1.55 * e, 0]} scale={focus === "armature" ? 1.08 : 1}>
          {Array.from({ length: 16 }).map((_, i) => (
            <mesh key={i} position={[0, (i - 7.5) * 0.032, 0]} castShadow>
              <cylinderGeometry args={[0.36, 0.36, 0.028, 24]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#3e4654" : "#505868"}
                metalness={0.55}
                roughness={0.42}
                {...gA}
              />
            </mesh>
          ))}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <mesh
                key={`tooth-${i}`}
                position={[Math.sin(a) * 0.4, 0, Math.cos(a) * 0.4]}
                rotation={[0, a, 0]}
                castShadow
              >
                <boxGeometry args={[0.09, 0.5, 0.11]} />
                <meshStandardMaterial color="#3a4250" metalness={0.5} roughness={0.45} {...gA} />
              </mesh>
            );
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
            return (
              <mesh
                key={`wind-${i}`}
                position={[Math.sin(a) * 0.32, 0, Math.cos(a) * 0.32]}
                rotation={[0, a, 0]}
              >
                <boxGeometry args={[0.07, 0.46, 0.07]} />
                <meshStandardMaterial
                  color="#b87333"
                  metalness={0.55}
                  roughness={0.35}
                  {...gA}
                />
              </mesh>
            );
          })}
        </group>

        {/* Commutator — copper bars + mica */}
        <group position={[0, -0.42 + 2.25 * e, 0]} scale={focus === "commutator" ? 1.12 : 1}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.14, 0.28, 16]} />
            <meshStandardMaterial color="#2b241c" roughness={0.7} />
          </mesh>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.sin(a) * 0.155, 0, Math.cos(a) * 0.155]}
                rotation={[0, a, 0]}
                castShadow
              >
                <boxGeometry args={[0.06, 0.26, 0.045]} />
                <meshStandardMaterial
                  color="#c47a32"
                  metalness={0.92}
                  roughness={0.14}
                  {...gC}
                />
              </mesh>
            );
          })}
        </group>

        {/* Steel shaft through the stack */}
        <group position={[0, 0.9 * e, 0]} scale={focus === "shaft" ? 1.08 : 1}>
          <mesh castShadow>
            <cylinderGeometry args={[0.055, 0.055, 2.35, 18]} />
            <meshStandardMaterial
              color="#d7dee6"
              metalness={0.96}
              roughness={0.1}
              {...gS}
            />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 16]} />
            <meshStandardMaterial color="#aeb6c0" metalness={0.9} roughness={0.16} />
          </mesh>
        </group>
      </group>

      {/* Carbon brushes in brass cages, springs */}
      <group>
        {[
          [0.38 + 0.35 * e, -0.42 + 2.35 * e, 0],
          [-0.38 - 0.35 * e, -0.42 + 2.35 * e, 0],
        ].map((p, i) => (
          <group key={i} position={p as [number, number, number]} scale={focus === "brushes" ? 1.12 : 1}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.18, 0.08]} />
              <meshStandardMaterial color="#1c1c1c" roughness={0.82} {...gB} />
            </mesh>
            <mesh position={[i === 0 ? 0.08 : -0.08, 0, 0]}>
              <boxGeometry args={[0.04, 0.2, 0.1]} />
              <meshStandardMaterial color="#b08d57" metalness={0.7} roughness={0.32} />
            </mesh>
            <mesh position={[i === 0 ? 0.12 : -0.12, 0.12, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
              <meshStandardMaterial color="#8d949e" metalness={0.85} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Front end bell + bearing */}
      <group position={[0, 0.72 + 2.85 * e, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.82, 0.82, 0.12, 36]} />
          <meshStandardMaterial color="#c5ccd4" metalness={0.78} roughness={0.28} {...gH} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.14, 0.035, 10, 18]} />
          <meshStandardMaterial color="#d8dde3" metalness={0.9} roughness={0.16} {...gS} />
        </mesh>
      </group>

      {/* Cooling fan on shaft rear */}
      <group position={[0, -0.95 - 1.35 * e, 0]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={i}
            rotation={[0, (i / 6) * Math.PI * 2, 0]}
            position={[0.18, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.28, 0.04, 0.1]} />
            <meshStandardMaterial color="#1f242c" roughness={0.6} />
          </mesh>
        ))}
      </group>
      <MotorMoments explode={e} spin={spin} focus={focus} />
    </group>
  );
}
