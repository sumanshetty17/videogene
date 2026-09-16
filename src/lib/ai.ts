import { createServerFn } from "@tanstack/react-start";
import { classifyPrompt, researchQuery } from "@/lib/classify";
import { filmFromPrompt } from "@/lib/films";
import { MOTOR_PARTS } from "@/lib/parts";
import { researchTopic } from "@/lib/research";
import {
  type Lesson,
  type LessonScene,
  type LookTarget,
  type SoundBed,
  type WorldKind,
} from "@/lib/storyboard";
import {
  isMotorTopic,
  kindFromName,
  partsFromNames,
  slugId,
  type TopicPart,
} from "@/lib/topic";

const SYSTEM = `You are a film director AND science teacher. Expand a SHORT user idea into a COMPLETE cinematic video. Do NOT merely read the prompt back.
Return JSON only.
Shape:
{
  "title": "film title",
  "mode": "lesson" | "story",
  "device": "motor" | "generic",
  "parts": [{"name":"","realName":"","detail":"","moment":"","kind":"shell|core|coil|disc|cell|block|sphere|pipe"}],
  "scenes": [{
    "title": "3-6 words",
    "narration": "40-80 word spoken narration that ADVANCES the story or TEACHES the mechanism. Never repeat the user prompt.",
    "world": "workshop|device|village|battlefield|night",
    "sound": "none|workshop|war|village|fire|storm|lab",
    "intensity": 0 to 1,
    "engineerAction": "idle|walk|talk|point|look|react|fight|flee|charge",
    "apprenticeAction": "idle|walk|talk|point|look|react|fight|flee|charge",
    "motorExplode": 0 to 1,
    "motorSpin": true/false,
    "shots": [{"kind":"wide|medium|close|orbit|push|track|low|over_shoulder","lookAt":"motor|engineer|apprentice|stage|hero|enemy|village","duration": number}]
  }]
}
Rules:
- If the user wants a STORY / movie / village / demon / war: mode=story. 8 to 12 scenes. Plot: setup, warning, attack, fire, gathering, clash, turning, victory. Village and battlefield worlds. War/fire/village sound. Intensity high in battle. Do not default to motors.
- If the user wants a LESSON / explain / law / how it works: mode=lesson. 6 to 9 scenes. Use the RESEARCH notes as ground truth. Teach mechanism with named parts. Do not invent numbers that contradict research.
- Short prompts MUST be expanded. The film is long. Shot durations 2.4 to 5.5 seconds. 2-4 shots per scene.
- Preserve real scientific terms from research.`;

const KINDS = new Set(["shell", "core", "coil", "disc", "cell", "block", "sphere", "pipe"]);
const WORLDS = new Set(["workshop", "device", "village", "battlefield", "night"]);
const SOUNDS = new Set(["none", "workshop", "war", "village", "fire", "storm", "lab"]);
const LOOKS = new Set(["motor", "engineer", "apprentice", "stage", "hero", "enemy", "village"]);

function coerceParts(raw: unknown, source: string, mode: Lesson["mode"]): TopicPart[] {
  if (mode === "story") return [];
  if (isMotorTopic(source) && !Array.isArray(raw)) return MOTOR_PARTS;
  const list = Array.isArray(raw) ? raw : [];
  const named = list
    .map((item, i) => {
      const o = (item ?? {}) as Record<string, unknown>;
      const name = String(o.name || o.realName || `Part ${i + 1}`).slice(0, 40);
      const kindRaw = String(o.kind || kindFromName(name));
      return {
        id: slugId(name, i),
        name,
        realName: String(o.realName || name).slice(0, 48),
        detail: String(o.detail || "").slice(0, 180),
        moment: String(o.moment || o.detail || "").slice(0, 220),
        kind: (KINDS.has(kindRaw) ? kindRaw : kindFromName(name)) as TopicPart["kind"],
      };
    })
    .filter((p) => p.name);
  if (named.length) return named.slice(0, 8);
  if (isMotorTopic(source)) return MOTOR_PARTS;
  return partsFromNames([], source);
}

function defaultSound(world: WorldKind): SoundBed {
  if (world === "battlefield") return "war";
  if (world === "village") return "village";
  if (world === "night") return "fire";
  if (world === "device") return "lab";
  return "workshop";
}

function coerceLesson(raw: unknown, source: string, extract: string): Lesson | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.scenes)) return null;
  const mode: Lesson["mode"] =
    obj.mode === "story" || classifyPrompt(source) === "story" ? "story" : "lesson";
  const parts = coerceParts(obj.parts, source, mode);
  const scenes: LessonScene[] = obj.scenes
    .slice(0, 12)
    .map((scene, id) => {
      const s = (scene ?? {}) as Record<string, unknown>;
      const shots = Array.isArray(s.shots)
        ? s.shots.slice(0, 5).map((shot) => {
            const sh = (shot ?? {}) as Record<string, unknown>;
            const look = String(sh.lookAt || "stage");
            return {
              kind: (String(sh.kind || "medium") as LessonScene["shots"][0]["kind"]),
              lookAt: (LOOKS.has(look) ? look : "stage") as LookTarget,
              duration: Math.min(6.5, Math.max(2.0, Number(sh.duration) || 3.2)),
            };
          })
        : [{ kind: "wide" as const, lookAt: "stage" as const, duration: 3.4 }];
      const worldRaw = String(s.world || (mode === "story" ? "village" : "workshop"));
      const world = (WORLDS.has(worldRaw) ? worldRaw : "workshop") as WorldKind;
      const soundRaw = String(s.sound || defaultSound(world));
      return {
        id,
        title: String(s.title || `Scene ${id + 1}`).slice(0, 48),
        narration: String(s.narration || "").slice(0, 520),
        world,
        sound: (SOUNDS.has(soundRaw) ? soundRaw : defaultSound(world)) as SoundBed,
        intensity: Math.min(1, Math.max(0, Number(s.intensity) || 0)),
        engineerAction: (String(s.engineerAction || "talk") as LessonScene["engineerAction"]),
        apprenticeAction: (String(
          s.apprenticeAction || "look",
        ) as LessonScene["apprenticeAction"]),
        motorExplode: Math.min(1, Math.max(0, Number(s.motorExplode) || 0)),
        motorSpin: Boolean(s.motorSpin),
        shots,
      };
    });
  if (!scenes.length) return null;
  return {
    title: String(obj.title || "Film").slice(0, 72),
    mode,
    device: isMotorTopic(source) || obj.device === "motor" ? "motor" : "generic",
    parts,
    research: extract.slice(0, 700),
    scenes,
  };
}

export const generateLesson = createServerFn({ method: "POST" })
  .validator((input: { source: string }) => input)
  .handler(async ({ data }) => {
    const source = data.source.trim().slice(0, 8000);
    if (!source) {
      return { ok: false as const, error: "Paste or upload some text first." };
    }

    const mode = classifyPrompt(source);
    const researched =
      mode === "lesson" ? await researchTopic(researchQuery(source)) : null;
    const extract = researched
      ? `${researched.title}: ${researched.extract}`
      : "";
    const fallback = filmFromPrompt(source, extract);

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: true as const,
        lesson: fallback,
        usedFallback: true,
        error: researched
          ? `Researched ${researched.title} on Wikipedia, then built the film.`
          : "Director AI is off. Built an expanded film from your idea.",
      };
    }

    const user = extract
      ? `USER IDEA:\n${source}\n\nRESEARCH (Wikipedia, use as ground truth):\n${extract}`
      : `USER IDEA (expand into a full ${mode}):\n${source}`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: mode === "story" ? 0.7 : 0.35,
        max_tokens: 3500,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      return {
        ok: true as const,
        lesson: fallback,
        usedFallback: true,
        error: `Director unavailable (${res.status}). Playing the expanded film.`,
      };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const jsonText = text.replace(/^```json\s*|\s*```$/g, "").trim();
    try {
      const parsed = coerceLesson(JSON.parse(jsonText), source, extract);
      if (!parsed) throw new Error("empty");
      return { ok: true as const, lesson: parsed, usedFallback: false };
    } catch {
      return {
        ok: true as const,
        lesson: fallback,
        usedFallback: true,
        error: "Could not parse the director cut. Playing the expanded film.",
      };
    }
  });
