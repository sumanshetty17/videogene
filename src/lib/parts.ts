import type { TopicPart } from "@/lib/topic";
import { partFromWindow } from "@/lib/topic";

export type MotorPart =
  | "housing"
  | "magnets"
  | "armature"
  | "commutator"
  | "brushes"
  | "shaft"
  | "field";

export const MOTOR_PARTS: TopicPart[] = [
  {
    id: "housing",
    name: "Stator housing",
    realName: "Drawn-steel yoke / can",
    kind: "shell",
    detail:
      "Zinc-plated steel tube. It is the magnetic return path and the shell the magnet tiles are bonded to.",
    moment:
      "The steel yoke closes the magnetic circuit so flux from the ferrite tiles can cut the armature.",
  },
  {
    id: "magnets",
    name: "Ferrite magnet tiles",
    realName: "Sintered ceramic arc magnets",
    kind: "core",
    detail:
      "Two curved ferrite tiles glued to the inner wall. One north, one south — they make the stator field.",
    moment:
      "The ferrite tiles hold a fixed N–S field across the air gap. That field does not spin.",
  },
  {
    id: "armature",
    name: "Laminated armature",
    realName: "Silicon-steel stack + copper windings",
    kind: "coil",
    detail:
      "Thin insulated steel laminations with T-teeth. Enamelled copper wire is wound in the slots.",
    moment:
      "Current in the slot windings makes each coil an electromagnet. In the stator field it feels a Lorentz force — torque.",
  },
  {
    id: "commutator",
    name: "Copper commutator",
    realName: "Segmented copper barrel",
    kind: "core",
    detail:
      "Copper bars around an insulator, mica gaps between them. Each bar is soldered to a coil end.",
    moment:
      "As the barrel turns, a new copper bar slides under each brush and the coil current reverses so torque never flips.",
  },
  {
    id: "brushes",
    name: "Carbon brushes",
    realName: "Graphite blocks + springs",
    kind: "block",
    detail:
      "Carbon-graphite blocks in brass cages. Springs keep them on the commutator as it spins.",
    moment:
      "Graphite blocks ride the spinning commutator. Current enters here from the DC supply.",
  },
  {
    id: "shaft",
    name: "Steel shaft",
    realName: "Hardened output shaft + bearings",
    kind: "pipe",
    detail:
      "The armature is pressed onto this shaft. Ball bearings in each end bell let it spin freely.",
    moment:
      "Torque from the armature stack is delivered here. Bearings keep the shaft turning true.",
  },
];

export const PART_CATALOG = MOTOR_PARTS;
export const PART_LABELS = Object.fromEntries(
  MOTOR_PARTS.map((p) => [p.id, p.name]),
) as Record<MotorPart, string>;
export const PART_MOMENTS = Object.fromEntries(
  MOTOR_PARTS.map((p) => [p.id, p.moment]),
) as Record<MotorPart, string>;

export type WordCue = {
  word: string;
  start: number;
  end: number;
  part: string | null;
};

export function buildWordCues(
  script: string,
  duration: number,
  parts: TopicPart[] = MOTOR_PARTS,
): WordCue[] {
  const words = script.trim().split(/\s+/).filter(Boolean);
  if (!words.length || duration <= 0) return [];
  const unit = duration / words.length;
  return words.map((word, i) => {
    const window = [words[i - 1], word, words[i + 1]].filter(Boolean).join(" ");
    return {
      word,
      start: i * unit,
      end: (i + 1) * unit,
      part: partFromWindow(window, parts),
    };
  });
}

export function cueAt(cues: WordCue[], time: number): WordCue | null {
  if (!cues.length) return null;
  const t = Math.max(0, time);
  return cues.find((c) => t >= c.start && t < c.end) ?? cues[cues.length - 1];
}

export function stickyPart(cues: WordCue[], time: number): string | null {
  const t = Math.max(0, time);
  let last: string | null = null;
  let lastAt = -1;
  for (const cue of cues) {
    if (cue.start > t) break;
    if (cue.part) {
      last = cue.part;
      lastAt = cue.start;
    }
  }
  if (last && t - lastAt > 5.5) return null;
  return last;
}

export function lessonScript(scenes: { narration: string }[]): string {
  return scenes.map((s) => s.narration.trim()).join(" ... ");
}

export function highlightRanges(text: string, partName: string | null) {
  if (!partName) return [{ text, active: false }];
  const escaped = partName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "gi");
  const out: { text: string; active: boolean }[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) out.push({ text: text.slice(last, match.index), active: false });
    out.push({ text: match[0], active: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), active: false });
  return out.length ? out : [{ text, active: false }];
}
