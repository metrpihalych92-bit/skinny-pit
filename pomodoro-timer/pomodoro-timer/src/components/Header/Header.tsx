import styles from './Header.module.css';

interface HeaderProps {
  isDark: boolean;
  soundEnabled: boolean;
  onThemeToggle: () => void;
  onSoundToggle: () => void;
}

export function Header({ isDark, soundEnabled, onThemeToggle, onSoundToggle }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>Pomodoro</div>
      <div className={styles.controls}>
        <button
          className={`${styles.iconBtn} ${soundEnabled ? styles.active : ''}`}
          onClick={onSoundToggle}
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
        >
          {soundEnabled ? '🔔' : '🔕'}
        </button>
        <button
          className={styles.iconBtn}
          onClick={onThemeToggle}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
