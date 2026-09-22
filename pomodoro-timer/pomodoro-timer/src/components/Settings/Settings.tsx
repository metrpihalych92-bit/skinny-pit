import { useState } from 'react';
import type { Settings as SettingsType } from '../../types';
import { NumberInput } from './NumberInput';
import { Toggle } from './Toggle';
import styles from './Settings.module.css';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => void;
  onReset: () => void;
}

export function Settings({ settings, onUpdate, onReset }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-controls="settings-panel"
      >
        <span>Settings</span>
        <span className={`${styles.triggerIcon} ${isOpen ? styles.open : ''}`}>⌄</span>
      </button>

      <div
        id="settings-panel"
        className={`${styles.panel} ${isOpen ? styles.visible : ''}`}
        role="region"
        aria-label="Timer settings"
      >
        <div className={styles.panelInner}>
          <div className={styles.sectionTitle}>Duration</div>

          <NumberInput
            label="Work"
            value={settings.workDuration}
            min={1}
            max={99}
            onChange={(v) => onUpdate('workDuration', v)}
          />
          <NumberInput
            label="Short Break"
            value={settings.shortBreakDuration}
            min={1}
            max={30}
            onChange={(v) => onUpdate('shortBreakDuration', v)}
          />
          <NumberInput
            label="Long Break"
            value={settings.longBreakDuration}
            min={1}
            max={60}
            onChange={(v) => onUpdate('longBreakDuration', v)}
          />

          <div className={styles.sectionTitle}>Cycles</div>

          <NumberInput
            label="Cycles before long break"
            value={settings.cyclesBeforeLongBreak}
            min={1}
            max={10}
            unit=""
            onChange={(v) => onUpdate('cyclesBeforeLongBreak', v)}
          />

          <div className={styles.sectionTitle}>Behavior</div>

          <Toggle
            label="Auto-start next period"
            checked={settings.autoStart}
            onChange={(v) => onUpdate('autoStart', v)}
          />
          <Toggle
            label="Sound notifications"
            checked={settings.soundEnabled}
            onChange={(v) => onUpdate('soundEnabled', v)}
          />

          <button className={styles.resetBtn} onClick={onReset}>
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
