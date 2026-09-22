import styles from './Settings.module.css';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className={styles.toggleRow}>
      <span className={styles.toggleLabel}>{label}</span>
      <div
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <div className={styles.toggleThumb} />
      </div>
    </label>
  );
}
