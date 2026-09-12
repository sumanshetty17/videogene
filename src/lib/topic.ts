export type PartKind =
  | "shell"
  | "core"
  | "coil"
  | "disc"
  | "cell"
  | "block"
  | "sphere"
  | "pipe";

export type TopicPart = {
  id: string;
  name: string;
  realName: string;
  detail: string;
  moment: string;
  kind: PartKind;
};

const STOP = new Set(
  `a an the and or of to in on for with from by as at is are was were be been being
  this that these those it its their his her our your you we they i he she
  into over after before then than so if but not no yes can may will would should
  how what when where why which who also just more most other some any each
  about used using use make made makes work works working between both same
  many much such only even still already often`.split(/\s+/),
);

export function slugId(name: string, i: number) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return slug || `part-${i}`;
}

export function kindFromName(name: string): PartKind {
  const t = name.toLowerCase();
  if (/coil|winding|wire|spring|loop/.test(t)) return "coil";
  if (/magnet|core|nucleus|rotor|armature|commutator/.test(t)) return "core";
  if (/battery|cell|tank|canister/.test(t)) return "cell";
  if (/housing|case|skull|wall|shell|chamber|yoke|stator|casing/.test(t))
    return "shell";
  if (/board|plate|layer|disc|disk|wafer|leaf/.test(t)) return "disc";
  if (/pipe|vessel|artery|vein|tube|shaft|axle/.test(t)) return "pipe";
  if (/heart|brain|sun|planet|atom|star|cell|organ|eye/.test(t)) return "sphere";
  return "block";
}

export function isMotorTopic(text: string) {
  return /dc motor|commutator|armature|stator housing|ferrite magnet/i.test(text);
}

export function extractPartNames(source: string): string[] {
  const words = source.match(/[A-Za-z][A-Za-z0-9-]{3,}/g) ?? [];
  const counts = new Map<string, { n: number; display: string }>();
  for (const raw of words) {
    const key = raw.toLowerCase();
    if (STOP.has(key) || key.length < 4) continue;
    const prev = counts.get(key);
    counts.set(key, { n: (prev?.n ?? 0) + 1, display: prev?.display ?? raw });
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n || b.display.length - a.display.length)
    .slice(0, 6)
    .map((v) => v.display);
}

export function partsFromNames(names: string[], source: string): TopicPart[] {
  const unique: string[] = [];
  for (const name of names) {
    const id = slugId(name, unique.length);
    if (!unique.some((_, i) => slugId(unique[i], i) === id)) unique.push(name);
  }
  const list = unique.slice(0, 6);
  if (!list.length) {
    return [
      {
        id: "idea",
        name: "Core idea",
        realName: "Theme",
        detail: source.slice(0, 140),
        moment: "The lesson holds on the main idea while the teacher explains it.",
        kind: "block",
      },
    ];
  }
  return list.map((name, i) => {
    const id = slugId(name, i);
    return {
      id,
      name: name[0].toUpperCase() + name.slice(1),
      realName: name,
      detail: `A real piece of this topic: ${name}. Pulled from the source and shown in the exploded assembly.`,
      moment: `The camera locks onto ${name} the moment it is named, so you see the actual component while you hear it.`,
      kind: kindFromName(name),
    };
  });
}

export function partFromWindow(window: string, parts: TopicPart[]): string | null {
  const hay = window.toLowerCase();
  for (const part of parts) {
    const tokens = [part.name, part.realName, part.id].map((s) => s.toLowerCase());
    if (tokens.some((t) => t.length >= 3 && hay.includes(t))) return part.id;
  }
  return null;
}
