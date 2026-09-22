import { useRef, useCallback } from 'react';
import type { Phase } from '../types';

export function useSound(soundEnabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback(
    (ctx: AudioContext, frequency: number, startTime: number, duration: number, volume = 0.3) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.05);
    },
    []
  );

  const playSound = useCallback(
    (phase: Phase) => {
      if (!soundEnabled) return;

      try {
        const ctx = getContext();
        const now = ctx.currentTime;

        if (phase === 'work') {
          // 3 ascending beeps
          playBeep(ctx, 880, now, 0.15);
          playBeep(ctx, 1047, now + 0.2, 0.15);
          playBeep(ctx, 1319, now + 0.4, 0.25);
        } else if (phase === 'shortBreak') {
          // 2 beeps
          playBeep(ctx, 659, now, 0.15);
          playBeep(ctx, 880, now + 0.2, 0.2);
        } else {
          // 1 long low tone
          playBeep(ctx, 440, now, 0.6, 0.25);
        }
      } catch {
        // AudioContext not available
      }
    },
    [soundEnabled, getContext, playBeep]
  );

  return { playSound };
}
