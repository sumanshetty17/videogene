import { createServerFn } from "@tanstack/react-start";
import { lessonFromSource } from "@/lib/lessonFromSource";
import { MOTOR_PARTS } from "@/lib/parts";
import { type Lesson, type LessonScene } from "@/lib/storyboard";
import {
  isMotorTopic,
  kindFromName,
  partsFromNames,
  slugId,
  type TopicPart,
} from "@/lib/topic";

const SYSTEM = `You are a cinematic teaching director for ANY topic, not only motors.
Return JSON only, no markdown.
Shape:
{
  "title": "short title",
  "device": "motor" | "generic",
  "parts": [
    {
      "name": "real component or concept name from the source",
      "realName": "engineering / scientific name",
      "detail": "one sentence of what this part actually is",
      "moment": "what it is doing in the working system",
      "kind": "shell|core|coil|disc|cell|block|sphere|pipe"
    }
  ],
  "scenes": [
    {
      "title": "3-6 word title",
      "narration": "25-50 word spoken teacher narration that NAMES the parts",
      "world": "workshop" | "device",
      "engineerAction": "idle"|"walk"|"talk"|"point"|"look"|"react",
      "apprenticeAction": "idle"|"walk"|"talk"|"point"|"look"|"react",
      "motorExplode": 0 to 1,
      "motorSpin": true/false,
      "shots": [{"kind":"wide|medium|close|orbit|push|track|low|over_shoulder","lookAt":"motor|engineer|apprentice|stage","duration": number}]
    }
  ]
}
Rules:
- Teach THIS source. Never default to a DC motor unless the source is about a motor.
- 4-6 named parts pulled from the source (organs, layers, components, steps).
- 4 to 6 scenes. At least two "device" scenes that explode/focus those parts.
- Workshop scenes keep characters talking/pointing. Vary cameras. Durations 1.6-4.2s.
- Do not invent numbers. Use the source's real terms.`;

const KINDS = new Set(["shell", "core", "coil", "disc", "cell", "block", "sphere", "pipe"]);

function coerceParts(raw: unknown, source: string): TopicPart[] {
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

function coerceLesson(raw: unknown, source: string): Lesson | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.scenes)) return null;
  const parts = coerceParts(obj.parts, source);
  const scenes: LessonScene[] = obj.scenes
    .slice(0, 8)
    .map((scene, id) => {
      const s = (scene ?? {}) as Record<string, unknown>;
      const shots = Array.isArray(s.shots)
        ? s.shots.slice(0, 5).map((shot) => {
            const sh = (shot ?? {}) as Record<string, unknown>;
            return {
              kind: (String(sh.kind || "medium") as LessonScene["shots"][0]["kind"]),
              lookAt: (String(sh.lookAt || "stage") as LessonScene["shots"][0]["lookAt"]),
              duration: Math.min(5.5, Math.max(1.4, Number(sh.duration) || 2.4)),
            };
          })
        : [{ kind: "wide" as const, lookAt: "stage" as const, duration: 3 }];
      const world =
        s.world === "workshop" ? ("workshop" as const) : ("device" as const);
      return {
        id,
        title: String(s.title || `Scene ${id + 1}`).slice(0, 48),
        narration: String(s.narration || "").slice(0, 320),
        world,
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
    title: String(obj.title || "Lesson").slice(0, 72),
    device: isMotorTopic(source) || obj.device === "motor" ? "motor" : "generic",
    parts,
    scenes,
  };
}

export const generateLesson = createServerFn({ method: "POST" })
  .validator((input: { source: string }) => input)
  .handler(async ({ data }) => {
    const source = data.source.trim().slice(0, 8000);
    if (!source) {
      return { ok: true as const, lesson: lessonFromSource("How a DC motor works"), usedFallback: true };
    }

    const fallback = lessonFromSource(source);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: true as const,
        lesson: fallback,
        usedFallback: true,
        error: "Director AI is off. Built a lesson directly from your text.",
      };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 2200,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: source },
        ],
      }),
    });

    if (!res.ok) {
      return {
        ok: true as const,
        lesson: fallback,
        usedFallback: true,
        error: `Director unavailable (${res.status}). Built a lesson from your text.`,
      };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const jsonText = text.replace(/^```json\s*|\s*```$/g, "").trim();
    try {
      const parsed = coerceLesson(JSON.parse(jsonText), source);
      if (!parsed) throw new Error("empty");
      return { ok: true as const, lesson: parsed, usedFallback: false };
    } catch {
      return {
        ok: true as const,
        lesson: fallback,
        usedFallback: true,
        error: "Could not parse a lesson. Built one from your text instead.",
      };
    }
  });
