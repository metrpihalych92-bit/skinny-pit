import styles from './CycleIndicator.module.css';

interface CycleIndicatorProps {
  currentCycle: number;
  totalCycles: number;
  completedCycles: number;
  isRunning: boolean;
}

export function CycleIndicator({ currentCycle, totalCycles, completedCycles, isRunning }: CycleIndicatorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.label}>Cycle Progress</div>
      <div className={styles.dots}>
        {Array.from({ length: totalCycles }, (_, i) => {
          const isCompleted = i < currentCycle;
          const isCurrent = i === currentCycle && isRunning;

          return (
            <div
              key={i}
              className={`${styles.dot} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
              aria-label={`Cycle ${i + 1}: ${isCompleted ? 'completed' : isCurrent ? 'in progress' : 'pending'}`}
            />
          );
        })}
      </div>
      {completedCycles > 0 && (
        <div className={styles.totalLabel}>
          Total sessions: {completedCycles}
        </div>
      )}
    </div>
  );
}
