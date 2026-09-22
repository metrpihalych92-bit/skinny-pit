import { useState, useCallback, useRef } from 'react';
import { useSettings } from './hooks/useSettings';
import { useSound } from './hooks/useSound';
import { useTimer } from './hooks/useTimer';
import { Header } from './components/Header/Header';
import { Timer } from './components/Timer/Timer';
import { Controls } from './components/Controls/Controls';
import { CycleIndicator } from './components/CycleIndicator/CycleIndicator';
import { Settings } from './components/Settings/Settings';
import type { Phase } from './types';
import styles from './App.module.css';
import './index.css';

function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('pomodoro-theme') !== 'light';
  });

  const { settings, updateSetting, resetSettings } = useSettings();
  const { playSound } = useSound(settings.soundEnabled);

  const handlePhaseEnd = useCallback(
    (phase: Phase) => {
      playSound(phase);
    },
    [playSound]
  );

  const { state, start, pause, reset, fullReset } = useTimer(settings, handlePhaseEnd);

  // Calculate total duration for current phase progress
  const totalDurationRef = useRef<number>(settings.workDuration * 60);
  const getPhaseDuration = (phase: Phase) => {
    if (phase === 'work') return settings.workDuration * 60;
    if (phase === 'shortBreak') return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60;
  };
  totalDurationRef.current = getPhaseDuration(state.phase);

  const handleThemeToggle = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('pomodoro-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleSoundToggle = () => {
    updateSetting('soundEnabled', !settings.soundEnabled);
  };

  return (
    <div className={`${styles.app} ${isDark ? styles.dark : styles.light}`}>
      <Header
        isDark={isDark}
        soundEnabled={settings.soundEnabled}
        onThemeToggle={handleThemeToggle}
        onSoundToggle={handleSoundToggle}
      />

      <main className={styles.main}>
        <Timer
          phase={state.phase}
          status={state.status}
          timeLeft={state.timeLeft}
          totalDuration={totalDurationRef.current}
        />

        <CycleIndicator
          currentCycle={state.currentCycle}
          totalCycles={settings.cyclesBeforeLongBreak}
          completedCycles={state.completedCycles}
          isRunning={state.status === 'running'}
        />

        <Controls
          status={state.status}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onFullReset={fullReset}
        />

        <Settings
          settings={settings}
          onUpdate={updateSetting}
          onReset={resetSettings}
        />
      </main>
    </div>
  );
}

export default App;
