import { createServerFn } from "@tanstack/react-start";

export const narrateLesson = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    const text = data.text.trim().slice(0, 3500);
    if (!text) return { ok: false as const, error: "Nothing to narrate" };
    if (!apiKey) return { ok: false as const, error: "Voice is not available" };

    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice_id: "eve" }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `Voice error ${res.status}` };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ok: true as const,
      mime: res.headers.get("content-type") || "audio/mpeg",
      audio: buf.toString("base64"),
    };
  });
