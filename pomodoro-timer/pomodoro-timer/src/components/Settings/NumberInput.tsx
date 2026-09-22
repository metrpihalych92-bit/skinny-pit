import styles from './Settings.module.css';

interface NumberInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function NumberInput({ label, value, min, max, unit = 'min', onChange }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= min && v <= max) {
      onChange(v);
    }
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className={styles.numRow}>
      <span className={styles.numLabel}>{label}</span>
      <div className={styles.numControl}>
        <button className={styles.numBtn} onClick={decrement} aria-label={`Decrease ${label}`}>−</button>
        <input
          className={styles.numInput}
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={handleChange}
          aria-label={label}
        />
        <span className={styles.numUnit}>{unit}</span>
        <button className={styles.numBtn} onClick={increment} aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  );
}
