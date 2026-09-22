import type { Phase } from '../../types';
import styles from './CircularProgress.module.css';

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = 300;
const CENTER = SIZE / 2;

const PHASE_COLORS: Record<Phase, string> = {
  work: '#a855f7',
  shortBreak: '#06b6d4',
  longBreak: '#10b981',
};

const PHASE_LABELS: Record<Phase, string> = {
  work: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface CircularProgressProps {
  timeLeft: number;
  totalDuration: number;
  phase: Phase;
  isRunning: boolean;
}

export function CircularProgress({ timeLeft, totalDuration, phase, isRunning }: CircularProgressProps) {
  const progress = totalDuration > 0 ? timeLeft / totalDuration : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const color = PHASE_COLORS[phase];

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ring */}
        <circle
          className={styles.trackRing}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
        />

        {/* Progress ring */}
        <circle
          className={styles.progressRing}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          filter={isRunning ? 'url(#glow)' : undefined}
          style={{
            filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`,
          }}
        />
      </svg>

      <div className={styles.center}>
        <div className={styles.time} style={{ color: 'var(--text-primary)' }}>
          {formatTime(timeLeft)}
        </div>
        <div className={styles.phase} style={{ color }}>
          {PHASE_LABELS[phase]}
        </div>
      </div>
    </div>
  );
}
