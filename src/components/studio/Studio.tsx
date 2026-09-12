import { Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stage } from "@/components/stage/Stage";
import { NarrationSync } from "@/components/studio/NarrationSync";
import { generateLesson } from "@/lib/ai";
import { useDirector } from "@/lib/director";
import { lessonFromSource } from "@/lib/lessonFromSource";
import { MOTOR_PARTS, highlightRanges } from "@/lib/parts";
import {
  SAMPLE_SOURCE,
  lessonDuration,
  resolvePlayback,
} from "@/lib/storyboard";

function PlaybackClock() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      const { voiceStatus, tick } = useDirector.getState();
      if (voiceStatus !== "ready") tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

export function Studio() {
  const lesson = useDirector((s) => s.lesson);
  const source = useDirector((s) => s.source);
  const time = useDirector((s) => s.time);
  const playing = useDirector((s) => s.playing);
  const generating = useDirector((s) => s.generating);
  const error = useDirector((s) => s.error);
  const focusPart = useDirector((s) => s.focusPart);
  const voiceStatus = useDirector((s) => s.voiceStatus);
  const voiceUnlocked = useDirector((s) => s.voiceUnlocked);
  const unlockVoice = useDirector((s) => s.unlockVoice);
  const setSource = useDirector((s) => s.setSource);
  const setLesson = useDirector((s) => s.setLesson);
  const setGenerating = useDirector((s) => s.setGenerating);
  const setError = useDirector((s) => s.setError);
  const toggle = useDirector((s) => s.toggle);
  const restart = useDirector((s) => s.restart);
  const seek = useDirector((s) => s.seek);
  const [localSource, setLocalSource] = useState(source || SAMPLE_SOURCE);

  const total = lessonDuration(lesson);
  const { scene, shot } = resolvePlayback(lesson, time);
  const progress = total > 0 ? time / total : 0;

  const catalog = lesson.parts?.length ? lesson.parts : MOTOR_PARTS;
  const focused = catalog.find((p) => p.id === focusPart) ?? null;

  async function onGenerate() {
    setGenerating(true);
    setError(null);
    setSource(localSource);
    try {
      const result = await generateLesson({ data: { source: localSource } });
      if (result.ok) {
        setLesson(result.lesson);
        if (result.error) setError(result.error);
      }
    } catch {
      setLesson(lessonFromSource(localSource));
      setError("Could not reach the director. Built a lesson from your text.");
    } finally {
      setGenerating(false);
    }
  }

  function onUpload(file: File | undefined) {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!/\.(txt|md|csv|json|html|text)$/.test(name) && !file.type.startsWith("text/")) {
      setError("Upload a text file (.txt, .md). PDF/binary is not read here — paste the text instead.");
      return;
    }
    void file.text().then((text) => {
      setLocalSource(text.slice(0, 8000));
      setError(null);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg lg:h-dvh lg:flex-row lg:overflow-hidden">
      <PlaybackClock />
      <NarrationSync />
      <section className="relative h-[58vh] w-full shrink-0 overflow-hidden bg-bg lg:h-full lg:min-h-0 lg:flex-1">
        <div className="absolute inset-0 bg-bg">
          <Stage />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-bg/80 to-transparent p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Reelmind cinematic studio
              </p>
              <h1 className="font-display mt-1 text-xl tracking-tight text-fg sm:text-2xl">
                {lesson.title}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-[var(--radius-sm)] border border-border bg-surface/80 px-3 py-2 font-mono text-[11px] text-muted backdrop-blur-sm">
                {shot.kind} · {scene.world}
              </div>
              {focused ? (
                <div className="rounded-[var(--radius-sm)] bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg">
                  {focused.name}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/85 to-transparent px-4 pb-4 pt-16 sm:px-6">
          <p className="mx-auto max-w-3xl text-center font-display text-base leading-snug text-fg sm:text-lg">
            {highlightRanges(scene.narration, focused?.name ?? null).map((chunk, i) =>
              chunk.active ? (
                <span key={i} className="text-accent">
                  {chunk.text}
                </span>
              ) : (
                <span key={i}>{chunk.text}</span>
              ),
            )}
          </p>
          <p className="mt-2 text-center text-xs text-muted">
            {scene.title}
            {voiceStatus === "loading" ? " · preparing voice" : ""}
            {voiceStatus === "ready" ? " · voice synced" : ""}
            {!voiceUnlocked ? " · tap play to sync voice" : ""}
          </p>
          <div className="pointer-events-auto mx-auto mt-4 flex max-w-xl items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                if (!voiceUnlocked) unlockVoice();
                else toggle();
              }}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={restart} aria-label="Restart">
              <RotateCcw className="size-4" />
            </Button>
            <input
              type="range"
              min={0}
              max={total || 1}
              step={0.05}
              value={time}
              onChange={(e) => seek(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-elevated accent-accent"
              aria-label="Timeline"
            />
            <span className="w-16 text-right font-mono text-xs tabular-nums text-muted">
              {Math.floor(progress * 100)}%
            </span>
          </div>
        </div>
      </section>

      <aside className="flex w-full flex-col gap-4 overflow-y-auto border-t border-border bg-surface p-4 sm:p-5 lg:w-[400px] lg:border-t-0 lg:border-l">
        <div>
          <h2 className="font-display text-lg">Exploded parts</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Components pulled from your text. The named part lights up and
            flies out as the lesson speaks.
          </p>
        </div>
        {focused ? (
          <div className="rounded-[var(--radius-md)] border border-accent/50 bg-elevated px-3 py-3">
            <p className="font-mono text-[10px] tracking-widest text-accent uppercase">
              Now happening
            </p>
            <p className="mt-1 text-sm leading-relaxed text-fg">{focused.moment}</p>
          </div>
        ) : null}
        <ul className="space-y-2">
          {catalog.map((part) => {
            const active = focusPart === part.id;
            return (
              <li
                key={part.id}
                className={`rounded-[var(--radius-md)] border px-3 py-2 ${
                  active
                    ? "border-accent bg-elevated"
                    : "border-border"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-fg">{part.name}</span>
                  <span className="font-mono text-[10px] tracking-wide text-muted uppercase">
                    {part.realName}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{part.detail}</p>
              </li>
            );
          })}
        </ul>
        <div>
          <h2 className="font-display text-lg">Direct a lesson</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Paste any topic, or upload a text file. The studio builds a
            narrated 3D teardown of that subject.
          </p>
        </div>
        <textarea
          value={localSource}
          onChange={(e) => setLocalSource(e.target.value)}
          rows={10}
          className="min-h-40 w-full resize-y rounded-[var(--radius-md)] border border-border bg-bg px-3 py-3 text-sm leading-relaxed text-fg outline-none focus:border-accent"
        />
        <label className="flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2 text-sm text-muted">
          <span>Upload a .txt / .md file</span>
          <input
            type="file"
            accept=".txt,.md,.csv,.json,.html,text/plain"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
        </label>
        {error ? <p className="text-xs text-muted">{error}</p> : null}
        <Button onClick={onGenerate} disabled={generating || !localSource.trim()}>
          <Sparkles className="size-4" />
          {generating ? "Directing…" : "Generate lesson video"}
        </Button>
        <ol className="space-y-2">
          {lesson.scenes.map((item, i) => {
            const active = item.id === scene.id;
            return (
              <li
                key={item.id}
                className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm ${
                  active
                    ? "border-accent/50 bg-elevated text-fg"
                    : "border-border text-muted"
                }`}
              >
                <span className="font-mono text-[10px] tracking-widest uppercase">
                  {String(i + 1).padStart(2, "0")} · {item.world}
                </span>
                <div className="font-medium text-fg">{item.title}</div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
