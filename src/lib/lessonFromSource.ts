import { MOTOR_PARTS } from "@/lib/parts";
import {
  extractPartNames,
  isMotorTopic,
  partsFromNames,
  type TopicPart,
} from "@/lib/topic";
import type { Lesson, LessonScene } from "@/lib/storyboard";

function sentences(source: string) {
  return source
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function chunk<T>(items: T[], n: number) {
  const size = Math.max(1, Math.ceil(items.length / n));
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.slice(0, n);
}

export function lessonFromSource(source: string): Lesson {
  const text = source.trim();
  const title =
    text.split(/[\n.]/, 1)[0]?.trim().slice(0, 72) || "Untitled lesson";
  const motor = isMotorTopic(text);
  const parts: TopicPart[] = motor
    ? MOTOR_PARTS
    : partsFromNames(extractPartNames(text), text);
  const bits = sentences(text);
  const groups = chunk(bits.length ? bits : [text.slice(0, 280)], Math.min(6, Math.max(4, bits.length || 4)));

  const scenes: LessonScene[] = groups.map((group, id) => {
    const narration = group.join(" ").slice(0, 320);
    const named = parts[id % parts.length];
    const device = id === 0 ? "workshop" : "device";
    return {
      id,
      title: named ? named.name : `Beat ${id + 1}`,
      narration:
        narration ||
        `Let's look at ${named?.name ?? "this idea"} and how it works in the real system.`,
      world: device,
      engineerAction: id % 2 === 0 ? "talk" : "point",
      apprenticeAction: id % 3 === 0 ? "look" : "react",
      motorExplode: device === "device" ? (id % 2 === 0 ? 1 : 0.45) : 0,
      motorSpin: device === "device" && id > 1,
      shots:
        device === "workshop"
          ? [
              { kind: "wide", lookAt: "stage", duration: 2.2 },
              { kind: "track", lookAt: "engineer", duration: 2.4 },
              { kind: "medium", lookAt: "apprentice", duration: 1.8 },
            ]
          : [
              { kind: "push", lookAt: "motor", duration: 2.6 },
              { kind: "orbit", lookAt: "motor", duration: 3.4 },
              { kind: "close", lookAt: "motor", duration: 2.4 },
            ],
    };
  });

  return { title, device: motor ? "motor" : "generic", parts, scenes };
}
