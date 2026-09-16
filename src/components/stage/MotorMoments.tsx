import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  explode: number;
  spin: boolean;
  focus: string | null;
};

function CurrentBeads({ active }: { active: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const n = 14;

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh || !active) {
      if (mesh) mesh.visible = false;
      return;
    }
    mesh.visible = true;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < n; i++) {
      const u = (t * 0.35 + i / n) % 1;
      // brush (+X) → commutator ring → winding
      const a = u * Math.PI * 2;
      const r = 0.18 + (u > 0.55 ? 0.16 : 0);
      dummy.position.set(Math.sin(a) * r, -0.42, Math.cos(a) * r);
      dummy.scale.setScalar(active ? 1 : 0.01);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <sphereGeometry args={[0.028, 8, 8]} />
      <meshStandardMaterial
        color="#e8c36a"
        emissive="#e8c36a"
        emissiveIntensity={0.9}
        roughness={0.4}
      />
    </instancedMesh>
  );
}

function FieldArcs({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.visible = active;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
  });
  return (
    <group ref={ref}>
      {[0.35, 0.55, 0.75].map((r) => (
        <mesh key={r} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[r, 0.012, 8, 32, Math.PI]} />
          <meshBasicMaterial color="#6ea8ff" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function TorqueMarks({ active, spinning }: { active: boolean; spinning: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.visible = active || spinning;
    if (spinning) ref.current.rotation.x += 2.3 * delta;
  });
  return (
    <group ref={ref} position={[0, 0.15, 0]}>
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.52, 0, Math.cos(a) * 0.52]}
            rotation={[0, a + Math.PI / 2, 0]}
          >
            <coneGeometry args={[0.04, 0.14, 8]} />
            <meshBasicMaterial color="#f0d090" />
          </mesh>
        );
      })}
    </group>
  );
}

function BrushSpark({ spinning }: { spinning: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const pulse = spinning && Math.sin(state.clock.elapsedTime * 28) > 0.72;
    ref.current.visible = pulse;
  });
  return (
    <mesh ref={ref} position={[0.22, -0.42, 0]}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshBasicMaterial color="#fff4c8" />
    </mesh>
  );
}

export function MotorMoments({ explode, spin, focus }: Props) {
  const current =
    focus === "brushes" || focus === "commutator" || focus === "armature" || spin;
  const field = focus === "magnets" || focus === "field" || focus === "housing";
  const torque = focus === "armature" || focus === "shaft" || spin;

  return (
    <group position={[0, 1.1 * explode, 0]}>
      <CurrentBeads active={current && explode < 0.85} />
      <FieldArcs active={field} />
      <TorqueMarks active={torque} spinning={spin} />
      <BrushSpark spinning={spin && explode < 0.7} />
    </group>
  );
}
