import { useState, useEffect, useRef, useCallback } from 'react';
import type { Phase, TimerState, Settings } from '../types';

function getPhaseDuration(phase: Phase, settings: Settings): number {
  if (phase === 'work') return settings.workDuration * 60;
  if (phase === 'shortBreak') return settings.shortBreakDuration * 60;
  return settings.longBreakDuration * 60;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const INITIAL_STATE: TimerState = {
  phase: 'work',
  status: 'idle',
  timeLeft: 25 * 60,
  currentCycle: 0,
  completedCycles: 0,
};

export function useTimer(
  settings: Settings,
  onPhaseEnd: (phase: Phase) => void
) {
  const [state, setState] = useState<TimerState>({
    ...INITIAL_STATE,
    timeLeft: settings.workDuration * 60,
  });

  const startTimestampRef = useRef<number | null>(null);
  const totalDurationRef = useRef<number>(settings.workDuration * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);

  stateRef.current = state;
  settingsRef.current = settings;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advancePhase = useCallback(
    (currentState: TimerState) => {
      const s = settingsRef.current;
      const { phase, currentCycle, completedCycles } = currentState;

      onPhaseEnd(phase);

      let nextPhase: Phase;
      let nextCycle = currentCycle;
      let nextCompleted = completedCycles;

      if (phase === 'work') {
        nextCycle = currentCycle + 1;
        if (nextCycle >= s.cyclesBeforeLongBreak) {
          nextPhase = 'longBreak';
          nextCompleted = completedCycles + 1;
          nextCycle = 0;
        } else {
          nextPhase = 'shortBreak';
        }
      } else {
        nextPhase = 'work';
      }

      const nextDuration = getPhaseDuration(nextPhase, s);
      totalDurationRef.current = nextDuration;

      const newState: TimerState = {
        phase: nextPhase,
        status: s.autoStart ? 'running' : 'idle',
        timeLeft: nextDuration,
        currentCycle: nextCycle,
        completedCycles: nextCompleted,
      };

      setState(newState);
      stateRef.current = newState;

      if (s.autoStart) {
        startTimestampRef.current = Date.now();
      } else {
        startTimestampRef.current = null;
      }

      return newState;
    },
    [onPhaseEnd]
  );

  const tick = useCallback(() => {
    if (startTimestampRef.current === null) return;

    const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
    const remaining = Math.max(0, totalDurationRef.current - elapsed);

    setState(prev => {
      if (prev.status !== 'running') return prev;
      return { ...prev, timeLeft: remaining };
    });

    if (remaining <= 0) {
      clearTimer();
      advancePhase(stateRef.current);
    }
  }, [clearTimer, advancePhase]);

  // Start interval when running
  useEffect(() => {
    if (state.status === 'running') {
      clearTimer();
      intervalRef.current = setInterval(tick, 500);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [state.status, tick, clearTimer]);

  // Update document title
  useEffect(() => {
    const phaseLabel =
      state.phase === 'work' ? 'Work' : state.phase === 'shortBreak' ? 'Break' : 'Long Break';
    document.title = `${formatTime(state.timeLeft)} — ${phaseLabel} | Pomodoro`;
  }, [state.timeLeft, state.phase]);

  // Reset timer when relevant settings change
  useEffect(() => {
    if (state.status === 'idle') {
      const newDuration = getPhaseDuration(state.phase, settings);
      totalDurationRef.current = newDuration;
      setState(prev => ({ ...prev, timeLeft: newDuration }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  const start = useCallback(() => {
    const remaining = stateRef.current.timeLeft;
    totalDurationRef.current = remaining;
    startTimestampRef.current = Date.now();
    setState(prev => ({ ...prev, status: 'running' }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, status: 'paused' }));
    startTimestampRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    startTimestampRef.current = null;
    const duration = getPhaseDuration(stateRef.current.phase, settingsRef.current);
    totalDurationRef.current = duration;
    setState(prev => ({ ...prev, status: 'idle', timeLeft: duration }));
  }, [clearTimer]);

  const fullReset = useCallback(() => {
    clearTimer();
    startTimestampRef.current = null;
    const duration = getPhaseDuration('work', settingsRef.current);
    totalDurationRef.current = duration;
    setState({
      phase: 'work',
      status: 'idle',
      timeLeft: duration,
      currentCycle: 0,
      completedCycles: 0,
    });
  }, [clearTimer]);

  return { state, start, pause, reset, fullReset };
}
