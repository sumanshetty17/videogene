import * as THREE from "three";
import type { TopicPart } from "@/lib/topic";

const COLORS: Record<TopicPart["kind"], string> = {
  shell: "#b7bec6",
  core: "#c0392b",
  coil: "#b87333",
  disc: "#4a6fa5",
  cell: "#2d6a4f",
  block: "#5b6574",
  sphere: "#7aa4d6",
  pipe: "#d5dce6",
};

type Props = {
  parts: TopicPart[];
  explode: number;
  spin: boolean;
  focus: string | null;
};

function Shape({ kind, active }: { kind: TopicPart["kind"]; active: boolean }) {
  const color = COLORS[kind];
  const mat = (
    <meshStandardMaterial
      color={color}
      metalness={kind === "pipe" || kind === "shell" ? 0.82 : 0.35}
      roughness={kind === "coil" ? 0.4 : 0.28}
      emissive={active ? "#2ee6c5" : "#000000"}
      emissiveIntensity={active ? 0.65 : 0}
    />
  );
  switch (kind) {
    case "shell":
      return (
        <mesh>
          <cylinderGeometry args={[0.42, 0.42, 0.7, 28, 1, true]} />
          {mat}
        </mesh>
      );
    case "core":
      return (
        <mesh>
          <cylinderGeometry args={[0.32, 0.32, 0.55, 24]} />
          {mat}
        </mesh>
      );
    case "coil":
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.08, 10, 24]} />
          {mat}
        </mesh>
      );
    case "disc":
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.08, 28]} />
          {mat}
        </mesh>
      );
    case "cell":
      return (
        <mesh>
          <cylinderGeometry args={[0.22, 0.22, 0.7, 20]} />
          {mat}
        </mesh>
      );
    case "sphere":
      return (
        <mesh>
          <sphereGeometry args={[0.34, 24, 18]} />
          {mat}
        </mesh>
      );
    case "pipe":
      return (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.9, 14]} />
          {mat}
        </mesh>
      );
    default:
      return (
        <mesh>
          <boxGeometry args={[0.5, 0.38, 0.38]} />
          {mat}
        </mesh>
      );
  }
}

export function partWorldPosition(index: number, explode: number): THREE.Vector3 {
  return new THREE.Vector3(index * 1.35 * Math.max(0.15, explode), 1.05, 0);
}

export function GenericDevice({ parts, explode, focus }: Props) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[parts.length * 0.5 * explode, 0, 0]} receiveShadow>
        <circleGeometry args={[2.8, 48]} />
        <meshStandardMaterial color="#0c1016" metalness={0.88} roughness={0.26} />
      </mesh>
      {parts.map((part, i) => {
        const active = focus === part.id;
        const x = i * 1.35 * Math.max(0.12, explode);
        return (
          <group
            key={part.id}
            position={[x, 1.05, 0]}
            scale={active ? 1.12 : 1}
          >
            <Shape kind={part.kind} active={active} />
          </group>
        );
      })}
    </group>
  );
}
