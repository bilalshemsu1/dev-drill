import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

export default function Timer() {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('stopwatch'); // 'stopwatch' | 'countdown'
    const [targetMinutes, setTargetMinutes] = useState(25); // default 25 min for coding interview practice

    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(prev => {
                    if (mode === 'countdown') {
                        if (prev <= 1) {
                            setIsRunning(false);
                            // Play alert sound or trigger notification if supported
                            try {
                                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                                const osc = audioCtx.createOscillator();
                                const gain = audioCtx.createGain();
                                osc.connect(gain);
                                gain.connect(audioCtx.destination);
                                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                                osc.start();
                                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
                                osc.stop(audioCtx.currentTime + 0.8);
                            } catch (e) {
                                // silent fallback
                            }
                            return 0;
                        }
                        return prev - 1;
                    } else {
                        return prev + 1;
                    }
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, mode]);

    const formatTime = (totalSec) => {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleToggle = () => {
        if (!isRunning && mode === 'countdown' && seconds === 0) {
            setSeconds(targetMinutes * 60);
        }
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        setIsRunning(false);
        setSeconds(mode === 'countdown' ? targetMinutes * 60 : 0);
    };

    const handleModeSwitch = (newMode, minutes = 25) => {
        setIsRunning(false);
        setMode(newMode);
        if (newMode === 'countdown') {
            setTargetMinutes(minutes);
            setSeconds(minutes * 60);
        } else {
            setSeconds(0);
        }
    };

    const isNearEnd = mode === 'countdown' && seconds > 0 && seconds <= 60;
    const isEnded = mode === 'countdown' && seconds === 0;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: isNearEnd ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${isNearEnd ? 'rgba(239, 68, 68, 0.4)' : 'var(--bg-panel-border)'}`,
            borderRadius: '8px',
            padding: '2px 6px',
            height: '30px',
            transition: 'all 0.2s ease',
        }}>
            <button
                onClick={handleToggle}
                title={isRunning ? "Pause Timer" : "Start Timer"}
                style={{
                    background: isRunning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                    border: 'none',
                    borderRadius: '5px',
                    color: isRunning ? '#f59e0b' : '#3b82f6',
                    cursor: 'pointer',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                }}
            >
                {isRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>

            <span
                style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    color: isNearEnd ? '#ef4444' : isEnded ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    minWidth: '45px',
                    textAlign: 'center',
                    userSelect: 'none',
                }}
                title={mode === 'countdown' ? `Target: ${targetMinutes} mins countdown` : 'Practice Stopwatch'}
            >
                {formatTime(seconds)}
            </span>

            {/* Quick Preset / Mode selector */}
            <select
                value={mode === 'stopwatch' ? 'stopwatch' : targetMinutes}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'stopwatch') {
                        handleModeSwitch('stopwatch');
                    } else {
                        handleModeSwitch('countdown', parseInt(val, 10));
                    }
                }}
                title="Timer Mode & Presets"
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    outline: 'none',
                    padding: '0 2px',
                }}
            >
                <option value="stopwatch" style={{ background: '#0f1319', color: 'white' }}>⏱ Up</option>
                <option value="15" style={{ background: '#0f1319', color: 'white' }}>⏳ 15m</option>
                <option value="25" style={{ background: '#0f1319', color: 'white' }}>⏳ 25m</option>
                <option value="45" style={{ background: '#0f1319', color: 'white' }}>⏳ 45m</option>
            </select>

            <button
                onClick={handleReset}
                title="Reset Timer"
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px',
                }}
            >
                <RotateCcw size={12} />
            </button>
        </div>
    );
}
