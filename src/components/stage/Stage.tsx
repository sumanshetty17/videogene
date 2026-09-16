import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useDirector } from "@/lib/director";
import { resolvePlayback } from "@/lib/storyboard";
import { BoneCharacter } from "@/components/stage/BoneCharacter";
import { CameraRig } from "@/components/stage/CameraRig";
import { DCMotor } from "@/components/stage/DCMotor";
import { GenericDevice, partWorldPosition } from "@/components/stage/GenericDevice";
import { LivingWorld } from "@/components/stage/LivingWorld";
import { StoryWorld } from "@/components/stage/StoryWorld";

function ResizeFix() {
  const { gl, camera } = useThree();
  useEffect(() => {
    const el = gl.domElement.parentElement;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 2 || h < 2) return;
      gl.setSize(w, h, false);
      if ("aspect" in camera) {
        (camera as typeof camera & { aspect: number }).aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gl, camera]);
  return null;
}

function SceneContents() {
  const lesson = useDirector((s) => s.lesson);
  const time = useDirector((s) => s.time);
  const focus = useDirector((s) => s.focusPart);
  const talkLevel = useDirector((s) => s.talkLevel);
  const hasLesson = useDirector((s) => s.hasLesson);
  const { scene, shot, shotT, sceneProgress } = resolvePlayback(lesson, time);
  const parts = lesson.parts ?? [];
  const story = hasLesson && lesson.mode === "story";
  const isMotor = hasLesson && !story && lesson.device === "motor";
  const onDevice = hasLesson && scene.world === "device";
  const explode = onDevice
    ? Math.max(scene.motorExplode, focus ? 0.9 : 0) * Math.min(1, 0.4 + sceneProgress)
    : scene.motorExplode;
  const workshop = !hasLesson || scene.world === "workshop";
  const engineerAction = talkLevel > 0.15 && !story ? "talk" : scene.engineerAction;
  const focusIndex = Math.max(0, parts.findIndex((p) => p.id === focus));
  const focusPoint = useMemo(() => {
    if (!focus || !hasLesson || story) return null;
    if (isMotor) return new THREE.Vector3(1.2, 1.05, 0);
    return partWorldPosition(focusIndex, Math.max(0.4, explode));
  }, [focus, focusIndex, explode, isMotor, hasLesson, story]);

  return (
    <>
      <ResizeFix />
      <CameraRig
        kind={shot.kind}
        lookAt={shot.lookAt}
        shotT={shotT}
        focus={hasLesson && !story ? focus : null}
        focusPoint={focusPoint}
      />
      {story ? (
        <StoryWorld world={scene.world} intensity={scene.intensity} />
      ) : (
        <LivingWorld workshop={workshop} />
      )}
      {hasLesson && isMotor ? (
        <DCMotor
          explode={explode}
          spin={scene.motorSpin || onDevice || focus === "shaft"}
          focus={focus}
        />
      ) : null}
      {hasLesson && !story && !isMotor && parts.length ? (
        <GenericDevice
          parts={parts}
          explode={Math.max(0.25, explode)}
          spin={scene.motorSpin}
          focus={focus}
        />
      ) : null}
      {story ? (
        <>
          <BoneCharacter
            position={[-1.3, 0, 1.1]}
            accent="#c45c2a"
            action={engineerAction}
            name="Hero"
            facing={1}
            talkLevel={talkLevel}
          />
          <BoneCharacter
            position={[0.2, 0, 1.6]}
            accent="#6a7a4a"
            action={scene.intensity > 0.5 ? "flee" : "look"}
            name="Villager"
            facing={-1}
            scale={0.92}
          />
          <BoneCharacter
            position={[-2.4, 0, 0.4]}
            accent="#4a5564"
            action={scene.world === "battlefield" ? "fight" : "walk"}
            name="Rider"
            facing={1}
          />
          <BoneCharacter
            position={[2.2, 0, -0.3]}
            accent="#2a0c08"
            action={scene.apprenticeAction}
            name="Demon"
            facing={-1}
            scale={1.45}
            skin="#3a2018"
            horns
          />
        </>
      ) : (
        <>
          <BoneCharacter
            position={[-1.4, 0, 1.2]}
            accent="#2ee6c5"
            action={hasLesson ? engineerAction : "idle"}
            name="Engineer"
            facing={1}
            talkLevel={hasLesson ? talkLevel : 0}
          />
          <BoneCharacter
            position={[1.5, 0, 1.4]}
            accent="#7aa4d6"
            action={hasLesson ? scene.apprenticeAction : "look"}
            name="Apprentice"
            facing={-1}
          />
        </>
      )}
      <ContactShadows opacity={0.45} scale={14} blur={2.4} far={4} />
    </>
  );
}

export function Stage() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [5.2, 2.4, 6.4], fov: 42, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#07080c", 1);
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        background: "#07080c",
      }}
      className="touch-none"
    >
      <SceneContents />
    </Canvas>
  );
}
