import { MOTOR_PARTS } from "@/lib/parts";
import type { TopicPart } from "@/lib/topic";

export type CharacterAction =
  | "idle"
  | "walk"
  | "talk"
  | "point"
  | "look"
  | "react";

export type ShotKind =
  | "wide"
  | "medium"
  | "close"
  | "orbit"
  | "push"
  | "track"
  | "low"
  | "over_shoulder";

export type LookTarget = "motor" | "engineer" | "apprentice" | "stage";

export type Shot = {
  kind: ShotKind;
  lookAt: LookTarget;
  duration: number;
};

export type LessonScene = {
  id: number;
  title: string;
  narration: string;
  world: "workshop" | "device";
  engineerAction: CharacterAction;
  apprenticeAction: CharacterAction;
  motorExplode: number;
  motorSpin: boolean;
  shots: Shot[];
};

export type Lesson = {
  title: string;
  device: "motor" | "generic";
  parts: TopicPart[];
  scenes: LessonScene[];
};

export const SAMPLE_SOURCE = `How a DC motor works

A DC motor converts electrical energy into mechanical rotation. It has a permanent magnet that creates a magnetic field, and a coil of wire (the armature) that sits inside that field. When current flows through the coil, it becomes an electromagnet. The interaction between the permanent magnet and the electromagnet produces a force that makes the coil rotate.

A commutator and brushes reverse the current direction every half turn so the rotation continues in the same direction. DC motors are used in fans, electric cars, toys, and many appliances.`;

export const DEFAULT_LESSON: Lesson = {
  title: "How a DC Motor Works",
  device: "motor",
  parts: MOTOR_PARTS,
  scenes: [
    {
      id: 0,
      title: "Why motors matter",
      narration:
        "Electric motors turn electricity into motion. They power fans, cars, robots, and almost every gadget that moves.",
      world: "workshop",
      engineerAction: "talk",
      apprenticeAction: "look",
      motorExplode: 0,
      motorSpin: false,
      shots: [
        { kind: "wide", lookAt: "stage", duration: 2.4 },
        { kind: "track", lookAt: "engineer", duration: 2.2 },
        { kind: "medium", lookAt: "apprentice", duration: 1.8 },
      ],
    },
    {
      id: 1,
      title: "Inside the motor",
      narration:
        "Let's pull the motor apart the way a real teardown looks. On the right: the steel stator housing, ferrite magnet tiles, laminated armature with copper windings, copper commutator, carbon brushes, and the steel shaft.",
      world: "device",
      engineerAction: "point",
      apprenticeAction: "look",
      motorExplode: 1,
      motorSpin: false,
      shots: [
        { kind: "push", lookAt: "motor", duration: 3.2 },
        { kind: "orbit", lookAt: "motor", duration: 6.4 },
        { kind: "close", lookAt: "motor", duration: 3.6 },
      ],
    },
    {
      id: 2,
      title: "How torque is made",
      narration:
        "Current leaves the supply through the carbon brushes, crosses onto a live commutator bar, and fills the armature windings. Those coils become electromagnets. In the ferrite field they feel a Lorentz force — real torque on the shaft. Every half-turn the commutator flips the current so the torque never reverses.",
      world: "device",
      engineerAction: "talk",
      apprenticeAction: "idle",
      motorExplode: 0.45,
      motorSpin: true,
      shots: [
        { kind: "low", lookAt: "motor", duration: 4.0 },
        { kind: "orbit", lookAt: "motor", duration: 4.4 },
        { kind: "push", lookAt: "motor", duration: 2.8 },
      ],
    },
    {
      id: 3,
      title: "In the workshop",
      narration:
        "In an electric car workshop, the engineer explains how the same motor principle drives the wheels.",
      world: "workshop",
      engineerAction: "talk",
      apprenticeAction: "react",
      motorExplode: 0,
      motorSpin: true,
      shots: [
        { kind: "wide", lookAt: "stage", duration: 2.0 },
        { kind: "over_shoulder", lookAt: "engineer", duration: 2.6 },
        { kind: "close", lookAt: "apprentice", duration: 2.2 },
      ],
    },
    {
      id: 4,
      title: "Putting it together",
      narration:
        "Electricity, magnets, and a clever switching system. That is how a DC motor turns current into reliable rotation.",
      world: "device",
      engineerAction: "idle",
      apprenticeAction: "idle",
      motorExplode: 0.15,
      motorSpin: true,
      shots: [
        { kind: "orbit", lookAt: "motor", duration: 3.4 },
        { kind: "wide", lookAt: "stage", duration: 2.8 },
      ],
    },
  ],
};

export function lessonDuration(lesson: Lesson) {
  return lesson.scenes.reduce(
    (sum, scene) =>
      sum + scene.shots.reduce((s, shot) => s + shot.duration, 0),
    0,
  );
}

export function resolvePlayback(lesson: Lesson, time: number) {
  let t = Math.max(0, time);
  for (const scene of lesson.scenes) {
    const sceneLen = scene.shots.reduce((s, shot) => s + shot.duration, 0);
    if (t <= sceneLen) {
      let acc = 0;
      for (let i = 0; i < scene.shots.length; i++) {
        const shot = scene.shots[i];
        if (t <= acc + shot.duration) {
          const local = t - acc;
          return {
            scene,
            shot,
            shotIndex: i,
            shotT: shot.duration > 0 ? local / shot.duration : 1,
            sceneProgress: sceneLen > 0 ? t / sceneLen : 1,
          };
        }
        acc += shot.duration;
      }
    }
    t -= sceneLen;
  }
  const last = lesson.scenes[lesson.scenes.length - 1];
  const lastShot = last.shots[last.shots.length - 1];
  return {
    scene: last,
    shot: lastShot,
    shotIndex: last.shots.length - 1,
    shotT: 1,
    sceneProgress: 1,
  };
}
