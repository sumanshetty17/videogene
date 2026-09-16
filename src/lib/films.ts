import { classifyPrompt } from "@/lib/classify";
import { MOTOR_PARTS } from "@/lib/parts";
import type { Lesson, LessonScene, SoundBed, WorldKind } from "@/lib/storyboard";
import { extractPartNames, isMotorTopic, partsFromNames } from "@/lib/topic";

function scene(
  id: number,
  title: string,
  narration: string,
  world: WorldKind,
  sound: SoundBed,
  intensity: number,
  engineerAction: LessonScene["engineerAction"],
  apprenticeAction: LessonScene["apprenticeAction"],
  shots: LessonScene["shots"],
  extra: Partial<LessonScene> = {},
): LessonScene {
  return {
    id,
    title,
    narration,
    world,
    sound,
    intensity,
    engineerAction,
    apprenticeAction,
    motorExplode: 0,
    motorSpin: false,
    shots,
    ...extra,
  };
}

export function villageWarFilm(): Lesson {
  return {
    title: "Ashvale: Night of the Demon",
    mode: "story",
    device: "generic",
    parts: [],
    research: "",
    scenes: [
      scene(
        0,
        "The quiet village",
        "Ashvale slept under a warm harvest moon. Smoke rose from the hearths. Children dreamed. No one heard the forest breathing.",
        "village",
        "village",
        0.1,
        "idle",
        "look",
        [
          { kind: "wide", lookAt: "village", duration: 4.2 },
          { kind: "track", lookAt: "hero", duration: 3.4 },
          { kind: "medium", lookAt: "stage", duration: 2.8 },
        ],
      ),
      scene(
        1,
        "The warning",
        "Old Mira woke to a smell like burned iron. The well had gone black. Dogs would not bark. She ran the lane shouting that something had crossed the ridge.",
        "night",
        "storm",
        0.3,
        "walk",
        "react",
        [
          { kind: "push", lookAt: "hero", duration: 3.6 },
          { kind: "low", lookAt: "village", duration: 3.2 },
        ],
      ),
      scene(
        2,
        "The demon arrives",
        "It came out of the treeline taller than the mill. Horns like broken ploughs. Eyes like kiln fire. The first hut blew apart in a rain of thatch and sparks.",
        "night",
        "fire",
        0.7,
        "flee",
        "charge",
        [
          { kind: "wide", lookAt: "enemy", duration: 3.8 },
          { kind: "close", lookAt: "enemy", duration: 2.6 },
          { kind: "orbit", lookAt: "enemy", duration: 4.0 },
        ],
      ),
      scene(
        3,
        "The village burns",
        "Families fled between the fences. The baker dragged a boy from the well. The demon walked through fire as if fire were a greeting.",
        "village",
        "war",
        0.75,
        "flee",
        "fight",
        [
          { kind: "track", lookAt: "hero", duration: 3.4 },
          { kind: "wide", lookAt: "village", duration: 4.2 },
        ],
      ),
      scene(
        4,
        "The war band",
        "At dawn the ridge riders arrived — rusted mail, farm spears, one true sword. Captain Ren drew a line in the dirt and said the village would not fall while anyone still stood.",
        "battlefield",
        "war",
        0.55,
        "point",
        "look",
        [
          { kind: "wide", lookAt: "stage", duration: 3.2 },
          { kind: "over_shoulder", lookAt: "hero", duration: 3.6 },
          { kind: "medium", lookAt: "hero", duration: 2.8 },
        ],
      ),
      scene(
        5,
        "First clash",
        "The demon hit the line like a falling barn. Shields split. Men were thrown. Ren rolled under a claw and cut the tendon of the left arm. Black dust poured out instead of blood.",
        "battlefield",
        "war",
        1,
        "fight",
        "fight",
        [
          { kind: "low", lookAt: "enemy", duration: 3.0 },
          { kind: "push", lookAt: "hero", duration: 3.4 },
          { kind: "orbit", lookAt: "stage", duration: 4.6 },
        ],
      ),
      scene(
        6,
        "The turning",
        "Mira smashed the harvest oil across the beast's back and the riders lit it. The roar shook the well stones. For the first time the demon stepped back.",
        "battlefield",
        "fire",
        0.9,
        "charge",
        "react",
        [
          { kind: "close", lookAt: "enemy", duration: 3.2 },
          { kind: "wide", lookAt: "village", duration: 4.0 },
        ],
      ),
      scene(
        7,
        "Last stand",
        "Ren drove the true sword through the kiln-bright eye. The body cracked like cooling iron and fell into the field. Ashvale still burned. But the village was alive.",
        "night",
        "fire",
        0.4,
        "idle",
        "look",
        [
          { kind: "low", lookAt: "hero", duration: 3.6 },
          { kind: "wide", lookAt: "village", duration: 5.0 },
          { kind: "push", lookAt: "stage", duration: 3.2 },
        ],
      ),
    ],
  };
}

export function ohmsLawFilm(extract = ""): Lesson {
  const extra = extract
    ? ` Research note: ${extract.slice(0, 280)}`
    : "";
  return {
    title: "Ohm's Law",
    mode: "lesson",
    device: "generic",
    research: extract.slice(0, 600),
    parts: partsFromNames(
      ["voltage", "current", "resistance", "circuit", "resistor"],
      "Ohm's law V = I R",
    ),
    scenes: [
      scene(
        0,
        "What the law is",
        "Ohm's law is the simple rule of electric circuits: voltage equals current times resistance. V equals I times R. Push harder, more flow — unless the pipe is narrow.",
        "workshop",
        "workshop",
        0,
        "talk",
        "look",
        [
          { kind: "wide", lookAt: "stage", duration: 3.2 },
          { kind: "medium", lookAt: "engineer", duration: 3.6 },
        ],
      ),
      scene(
        1,
        "Voltage",
        "Voltage is electrical pressure, measured in volts. A battery is a pump. A nine volt cell pushes charges harder than a one-and-a-half volt cell.",
        "device",
        "lab",
        0,
        "point",
        "look",
        [
          { kind: "push", lookAt: "motor", duration: 3.4 },
          { kind: "close", lookAt: "motor", duration: 3.0 },
        ],
        { motorExplode: 0.8 },
      ),
      scene(
        2,
        "Current",
        "Current is the flow of charge, measured in amperes. One ampere is a coulomb of charge passing a point each second. In a wire, that is electrons drifting under the field.",
        "device",
        "lab",
        0,
        "talk",
        "react",
        [
          { kind: "orbit", lookAt: "motor", duration: 4.2 },
          { kind: "low", lookAt: "motor", duration: 3.0 },
        ],
        { motorExplode: 0.9, motorSpin: true },
      ),
      scene(
        3,
        "Resistance",
        "Resistance is how much the material fights that flow, measured in ohms. A thin, long, hot wire resists more. A thick copper bar resists less.",
        "device",
        "lab",
        0,
        "point",
        "look",
        [
          { kind: "close", lookAt: "motor", duration: 3.4 },
          { kind: "orbit", lookAt: "motor", duration: 3.8 },
        ],
        { motorExplode: 1 },
      ),
      scene(
        4,
        "The formula",
        "Hold two numbers and the third is fixed. Double the voltage, double the current if resistance stays the same. Double the resistance, halve the current. That is the mechanism.",
        "workshop",
        "workshop",
        0,
        "talk",
        "react",
        [
          { kind: "over_shoulder", lookAt: "engineer", duration: 3.2 },
          { kind: "medium", lookAt: "apprentice", duration: 3.0 },
        ],
      ),
      scene(
        5,
        "In the real world",
        `A heater is a resistor that turns current into heat. A fuse melts if current is too high. Designers size wires so Ohm's law never cooks the house.${extra}`,
        "device",
        "lab",
        0,
        "idle",
        "look",
        [
          { kind: "wide", lookAt: "stage", duration: 3.0 },
          { kind: "push", lookAt: "motor", duration: 4.2 },
        ],
        { motorExplode: 0.4, motorSpin: true },
      ),
    ],
  };
}

export function filmFromPrompt(source: string, extract = ""): Lesson {
  const text = source.trim();
  if (classifyPrompt(text) === "story") return villageWarFilm();
  if (/ohm/i.test(text)) return ohmsLawFilm(extract);
  if (isMotorTopic(text)) {
    return {
      title: "How a DC Motor Works",
      mode: "lesson",
      device: "motor",
      parts: MOTOR_PARTS,
      research: extract.slice(0, 600),
      scenes: ohmsLawFilm().scenes.map((s, id) => ({
        ...s,
        id,
        world: id === 0 ? "workshop" : "device",
      })),
    };
  }
  const parts = partsFromNames(extractPartNames(extract || text), extract || text);
  const paras = (extract || text).split(/(?<=[.!?])\s+/).filter((s) => s.length > 30);
  const n = Math.min(8, Math.max(5, paras.length || 5));
  const scenes: LessonScene[] = Array.from({ length: n }, (_, id) => {
    const bit = paras[id] || paras[id % Math.max(1, paras.length)] || text;
    const named = parts[id % Math.max(1, parts.length)];
    const device = id % 3 === 0 ? "workshop" : "device";
    return scene(
      id,
      named?.name || `Beat ${id + 1}`,
      bit.slice(0, 420),
      device,
      device === "workshop" ? "workshop" : "lab",
      0,
      id % 2 === 0 ? "talk" : "point",
      id % 3 === 0 ? "look" : "react",
      device === "workshop"
        ? [
            { kind: "wide", lookAt: "stage", duration: 3.0 },
            { kind: "medium", lookAt: "engineer", duration: 3.4 },
          ]
        : [
            { kind: "push", lookAt: "motor", duration: 3.4 },
            { kind: "orbit", lookAt: "motor", duration: 4.2 },
            { kind: "close", lookAt: "motor", duration: 3.0 },
          ],
      { motorExplode: device === "device" ? 0.85 : 0, motorSpin: id > 2 },
    );
  });
  return {
    title: text.split(/[\n.]/, 1)[0]?.slice(0, 72) || "Lesson",
    mode: "lesson",
    device: "generic",
    parts,
    research: extract.slice(0, 600),
    scenes,
  };
}
