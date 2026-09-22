import type { TimerStatus } from '../../types';
import styles from './Controls.module.css';

interface ControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onFullReset: () => void;
}

export function Controls({ status, onStart, onPause, onReset, onFullReset }: ControlsProps) {
  const isRunning = status === 'running';

  return (
    <div className={styles.container}>
      <button
        className={styles.secondaryBtn}
        onClick={onFullReset}
        title="Full reset"
        aria-label="Full reset"
      >
        ⏮
      </button>

      <button
        className={`${styles.primaryBtn} ${isRunning ? styles.pause : ''}`}
        onClick={isRunning ? onPause : onStart}
        aria-label={isRunning ? 'Pause' : 'Start'}
      >
        <span className={styles.icon}>{isRunning ? '⏸' : '▶'}</span>
        {isRunning ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
      </button>

      <button
        className={styles.secondaryBtn}
        onClick={onReset}
        title="Reset current phase"
        aria-label="Reset current phase"
      >
        ↺
      </button>
    </div>
  );
}
