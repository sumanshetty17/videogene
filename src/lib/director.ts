import { create } from "zustand";
import { DEFAULT_LESSON, type Lesson } from "@/lib/storyboard";

type DirectorState = {
  lesson: Lesson;
  source: string;
  time: number;
  playing: boolean;
  generating: boolean;
  error: string | null;
  focusPart: string | null;
  spokenWord: string;
  talkLevel: number;
  voiceStatus: "idle" | "loading" | "ready" | "error";
  voiceUnlocked: boolean;
  setLesson: (lesson: Lesson) => void;
  setSource: (source: string) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  setFocus: (part: string | null, word?: string) => void;
  setTalkLevel: (level: number) => void;
  setVoiceStatus: (voiceStatus: DirectorState["voiceStatus"]) => void;
  unlockVoice: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  tick: (dt: number) => void;
  setTime: (time: number) => void;
  restart: () => void;
};

export const useDirector = create<DirectorState>((set, get) => ({
  lesson: DEFAULT_LESSON,
  source: "",
  time: 0,
  playing: true,
  generating: false,
  error: null,
  focusPart: null,
  spokenWord: "",
  talkLevel: 0,
  voiceStatus: "idle",
  voiceUnlocked: false,
  setLesson: (lesson) =>
    set({
      lesson,
      time: 0,
      playing: true,
      error: null,
      focusPart: null,
      spokenWord: "",
      voiceStatus: "idle",
    }),
  setSource: (source) => set({ source }),
  setGenerating: (generating) => set({ generating }),
  setError: (error) => set({ error }),
  setFocus: (part, word) =>
    set({ focusPart: part, spokenWord: word ?? get().spokenWord }),
  setTalkLevel: (talkLevel) => set({ talkLevel }),
  setVoiceStatus: (voiceStatus) => set({ voiceStatus }),
  unlockVoice: () => set({ voiceUnlocked: true, playing: true }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false, talkLevel: 0 }),
  toggle: () => {
    const playing = !get().playing;
    set({
      playing,
      talkLevel: playing ? get().talkLevel : 0,
      voiceUnlocked: playing ? true : get().voiceUnlocked,
    });
  },
  seek: (time) => set({ time: Math.max(0, time) }),
  setTime: (time) => set({ time: Math.max(0, time) }),
  tick: (dt) => {
    const { playing, time, lesson } = get();
    if (!playing) return;
    const total = lesson.scenes.reduce(
      (sum, scene) =>
        sum + scene.shots.reduce((s, shot) => s + shot.duration, 0),
      0,
    );
    const next = time + dt;
    if (next >= total) {
      set({ time: total, playing: false, talkLevel: 0 });
      return;
    }
    set({ time: next });
  },
  restart: () => set({ time: 0, playing: true, focusPart: null, voiceUnlocked: true }),
}));
