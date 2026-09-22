import type { Phase, TimerStatus } from '../../types';
import { CircularProgress } from './CircularProgress';
import styles from './Timer.module.css';

interface TimerProps {
  phase: Phase;
  status: TimerStatus;
  timeLeft: number;
  totalDuration: number;
}

export function Timer({ phase, status, timeLeft, totalDuration }: TimerProps) {
  const isRunning = status === 'running';

  return (
    <div className={`${styles.container} ${isRunning ? styles.pulsing : ''}`}>
      <CircularProgress
        timeLeft={timeLeft}
        totalDuration={totalDuration}
        phase={phase}
        isRunning={isRunning}
      />
    </div>
  );
}
