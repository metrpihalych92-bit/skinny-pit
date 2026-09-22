export type Phase = 'work' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Settings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
  autoStart: boolean;
  soundEnabled: boolean;
}

export interface TimerState {
  phase: Phase;
  status: TimerStatus;
  timeLeft: number;
  currentCycle: number;
  completedCycles: number;
}
