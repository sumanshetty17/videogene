import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { LookTarget, ShotKind } from "@/lib/storyboard";

const TARGETS: Record<LookTarget, THREE.Vector3> = {
  motor: new THREE.Vector3(0.6, 1.05, 0),
  engineer: new THREE.Vector3(-1.35, 1.25, 1.15),
  apprentice: new THREE.Vector3(1.45, 1.2, 1.35),
  stage: new THREE.Vector3(0, 1.1, 0.4),
  hero: new THREE.Vector3(-1.2, 1.25, 1.1),
  enemy: new THREE.Vector3(2.1, 1.7, -0.4),
  village: new THREE.Vector3(0.2, 1.3, -1.8),
};

function shotOffset(kind: ShotKind, t: number, close: boolean): THREE.Vector3 {
  const orbit = t * Math.PI * 1.15;
  switch (kind) {
    case "wide":
      return new THREE.Vector3(5.2, 2.6, 6.4);
    case "medium":
      return new THREE.Vector3(2.2, 1.55, 3.2);
    case "close":
      return new THREE.Vector3(1.15, 0.85, 1.7);
    case "orbit":
      return new THREE.Vector3(
        Math.sin(orbit) * (close ? 2.6 : 4.2),
        1.55 + Math.sin(t * 2) * 0.12,
        Math.cos(orbit) * (close ? 2.6 : 4.2),
      );
    case "push":
      return new THREE.Vector3(3.4 - t * 1.7, 1.7 - t * 0.2, 4.2 - t * 1.6);
    case "track":
      return new THREE.Vector3(-2.2 + t * 2.4, 1.55, 3.4);
    case "low":
      return new THREE.Vector3(2.6, 0.48, 3.3);
    case "over_shoulder":
      return new THREE.Vector3(0.9, 1.7, 2.2);
    default:
      return new THREE.Vector3(4, 2, 5);
  }
}

type Props = {
  kind: ShotKind;
  lookAt: LookTarget;
  shotT: number;
  focus: string | null;
  focusPoint?: THREE.Vector3 | null;
};

export function CameraRig({ kind, lookAt, shotT, focus, focusPoint }: Props) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  const desired = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.08);
    const target =
      focus && focusPoint
        ? focusPoint
        : (TARGETS[lookAt] ?? TARGETS.motor);
    const camKind = focus ? "close" : kind;
    const close = Boolean(focus) || lookAt === "motor";
    desired.copy(shotOffset(camKind, shotT, close)).add(target);
    camera.position.lerp(desired, 1 - Math.exp(-2.6 * d));
    look.current.lerp(target, 1 - Math.exp(-3.4 * d));
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const goal = focus || camKind === "close" ? 30 : camKind === "wide" ? 48 : 38;
      camera.fov += (goal - camera.fov) * 0.1;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
