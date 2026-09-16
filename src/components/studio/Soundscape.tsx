import { useEffect, useRef } from "react";
import type { SoundBed } from "@/lib/storyboard";
import { useDirector } from "@/lib/director";

function noiseBuffer(ctx: AudioContext) {
  const n = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function Soundscape() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const playing = useDirector((s) => s.playing);
  const hasLesson = useDirector((s) => s.hasLesson);
  const time = useDirector((s) => s.time);
  const lesson = useDirector((s) => s.lesson);

  useEffect(() => {
    return () => {
      oscRef.current?.stop();
      srcRef.current?.stop();
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!hasLesson || !playing) {
      if (gainRef.current && ctxRef.current)
        gainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.08);
      return;
    }
    let acc = 0;
    let bed: SoundBed = "none";
    let intensity = 0;
    for (const scene of lesson.scenes) {
      const len = scene.shots.reduce((s, sh) => s + sh.duration, 0);
      if (time <= acc + len) {
        bed = scene.sound;
        intensity = scene.intensity;
        break;
      }
      acc += len;
    }

    const start = () => {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!ctxRef.current) ctxRef.current = new AudioCtx();
      const ctx = ctxRef.current;
      void ctx.resume();
      if (!gainRef.current) {
        const gain = ctx.createGain();
        gain.gain.value = 0;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer(ctx);
        src.loop = true;
        src.connect(filter);
        filter.connect(gain);
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 55;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.04;
        osc.connect(oscGain);
        oscGain.connect(gain);
        gain.connect(ctx.destination);
        src.start();
        osc.start();
        gainRef.current = gain;
        filterRef.current = filter;
        oscRef.current = osc;
        srcRef.current = src;
      }
      const war = bed === "war" || bed === "fire";
      const village = bed === "village";
      const level =
        bed === "none"
          ? 0
          : war
            ? 0.08 + intensity * 0.12
            : village
              ? 0.035
              : 0.03;
      gainRef.current.gain.setTargetAtTime(level, ctx.currentTime, 0.12);
      if (filterRef.current)
        filterRef.current.frequency.setTargetAtTime(
          war ? 280 + intensity * 700 : village ? 900 : 500,
          ctx.currentTime,
          0.2,
        );
      if (oscRef.current)
        oscRef.current.frequency.setTargetAtTime(
          war ? 48 + intensity * 18 : 110,
          ctx.currentTime,
          0.2,
        );
    };
    start();
  }, [playing, hasLesson, time, lesson]);

  return null;
}
