import { useEffect, useRef } from "react";
import { useDirector } from "@/lib/director";
import {
  buildWordCues,
  cueAt,
  lessonScript,
  stickyPart,
  type WordCue,
} from "@/lib/parts";
import { lessonDuration } from "@/lib/storyboard";
import { narrateLesson } from "@/lib/tts";

const cache = new Map<string, string>();

function applyCues(cues: WordCue[], t: number) {
  const cue = cueAt(cues, t);
  const part = stickyPart(cues, t);
  useDirector.getState().setFocus(part, cue?.word ?? "");
}

export function NarrationSync() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cuesRef = useRef<WordCue[]>([]);
  const usingAudioRef = useRef(false);
  const lesson = useDirector((s) => s.lesson);
  const playing = useDirector((s) => s.playing);
  const time = useDirector((s) => s.time);
  const voiceUnlocked = useDirector((s) => s.voiceUnlocked);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    cuesRef.current = buildWordCues(
      lessonScript(lesson.scenes),
      lessonDuration(lesson),
      lesson.parts,
    );
  }, [lesson]);

  useEffect(() => {
    if (!voiceUnlocked) return;
    let cancelled = false;
    const script = lessonScript(lesson.scenes);

    async function prepare() {
      const audio = audioRef.current;
      if (!audio || !script) return;
      useDirector.getState().setVoiceStatus("loading");
      try {
        let url = cache.get(script);
        if (!url) {
          const result = await narrateLesson({ data: { text: script } });
          if (cancelled) return;
          if (result.ok) {
            const bin = Uint8Array.from(atob(result.audio), (c) => c.charCodeAt(0));
            url = URL.createObjectURL(new Blob([bin], { type: result.mime }));
            cache.set(script, url);
          }
        }
        if (cancelled) return;
        if (url) {
          audio.src = url;
          usingAudioRef.current = true;
          useDirector.getState().setVoiceStatus("ready");
          if (useDirector.getState().playing) {
            await audio.play().catch(() => undefined);
          }
          return;
        }
        usingAudioRef.current = false;
        useDirector.getState().setVoiceStatus("error");
        speakFallback(script);
      } catch {
        if (cancelled) return;
        usingAudioRef.current = false;
        useDirector.getState().setVoiceStatus("error");
        speakFallback(script);
      }
    }

    function speakFallback(text: string) {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.98;
      utter.onboundary = (event) => {
        const word = text.slice(
          event.charIndex,
          event.charIndex + (event.charLength || 16),
        );
        applyCues(cuesRef.current, useDirector.getState().time);
        useDirector.getState().setTalkLevel(0.7);
        void word;
      };
      utter.onend = () => useDirector.getState().setTalkLevel(0);
      if (useDirector.getState().playing) window.speechSynthesis.speak(utter);
    }

    void prepare();
    return () => {
      cancelled = true;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [lesson, voiceUnlocked]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !usingAudioRef.current) {
      if ("speechSynthesis" in window) {
        if (!playing) window.speechSynthesis.cancel();
      }
      return;
    }
    if (playing) audio.play().catch(() => undefined);
    else audio.pause();
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (!usingAudioRef.current || !Number.isFinite(audio.duration) || audio.duration <= 0)
        return;
      const lessonNow = useDirector.getState().lesson;
      const total = lessonDuration(lessonNow);
      useDirector.getState().setTime((audio.currentTime / audio.duration) * total);
      const cues = buildWordCues(
        lessonScript(lessonNow.scenes),
        audio.duration,
        lessonNow.parts,
      );
      applyCues(cues, audio.currentTime);
      useDirector
        .getState()
        .setTalkLevel(audio.paused ? 0 : 0.45 + 0.55 * Math.abs(Math.sin(audio.currentTime * 14)));
    };
    const onEnded = () => {
      useDirector.getState().pause();
      useDirector.getState().setTalkLevel(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (usingAudioRef.current) return;
    applyCues(cuesRef.current, time);
  }, [time]);

  return null;
}
