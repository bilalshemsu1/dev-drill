import React from 'react';
import { Flame, ArrowUpCircle } from 'lucide-react';

const DIFF_COLORS = {
    Easy: '#10b981',
    Medium: '#f59e0b',
    Hard: '#ef4444',
};

export default function StatusBar({
    problem,
    trackCode = '01',
    trackName = '',
    solvedCount = 0,
    totalCount = 0,
    language = 'python',
    cursorPos = { lineNumber: 1, column: 1 },
    streak = 0,
    updateInfo = null,
    onOpenHeatmap,
    onOpenUpdate,
}) {
    const diffColor = DIFF_COLORS[problem?.difficulty] || '#10b981';
    const pct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

    return (
        <footer
            className="desktop-status-bar"
            style={{
                height: '24px',
                minHeight: '24px',
                width: '100%',
                background: 'var(--bg-main)',
                borderTop: '1px solid var(--bg-panel-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.85rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-tertiary)',
                userSelect: 'none',
                zIndex: 20,
            }}
        >
            {/* Left section: Track, Problem, Solved, Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                {/* Track Code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>[{trackCode}]</span>
                    <span style={{ display: 'none', mdDisplay: 'inline' }}>{trackName}</span>
                </div>

                <span style={{ opacity: 0.3 }}>│</span>

                {/* Problem ID & Difficulty */}
                {problem && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            #{String(problem.id).padStart(3, '0')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: diffColor }} />
                            <span style={{ color: diffColor, fontWeight: 700 }}>{problem.difficulty}</span>
                        </div>
                    </div>
                )}

                <span style={{ opacity: 0.3 }}>│</span>

                {/* Solved Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{solvedCount}/{totalCount}</span>
                    <span>solved</span>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>({pct}%)</span>
                </div>

                <span style={{ opacity: 0.3 }}>│</span>

                {/* Offline Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ letterSpacing: '0.04em', fontSize: '0.68rem', fontWeight: 600 }}>OFFLINE</span>
                </div>
            </div>

            {/* Right section: Language, Cursor, Encoding, Streak, Update */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                {/* Language */}
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {language === 'python' ? 'Python 3.10' : 'JavaScript (ES6)'}
                </span>

                <span style={{ opacity: 0.3 }}>│</span>

                {/* Cursor Line & Column */}
                <span style={{ color: 'var(--text-secondary)' }}>
                    Ln {cursorPos?.lineNumber || 1}, Col {cursorPos?.column || 1}
                </span>

                <span style={{ opacity: 0.3 }}>│</span>

                {/* Encoding */}
                <span style={{ opacity: 0.7 }}>UTF-8</span>

                <span style={{ opacity: 0.3 }}>│</span>

                {/* Streak button */}
                <button
                    onClick={onOpenHeatmap}
                    title="View Streak Heatmap"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'transparent',
                        border: 'none',
                        color: streak > 0 ? '#f97316' : 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        fontWeight: 700,
                    }}
                >
                    <Flame size={12} color="#f97316" />
                    <span>{streak}d</span>
                </button>

                {/* Update pill if update available */}
                {updateInfo?.hasUpdate && (
                    <>
                        <span style={{ opacity: 0.3 }}>│</span>
                        <button
                            onClick={onOpenUpdate}
                            title={`Update available: v${updateInfo.latestVersion}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--accent-primary)',
                                cursor: 'pointer',
                                padding: 0,
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                fontWeight: 700,
                            }}
                        >
                            <ArrowUpCircle size={12} color="var(--accent-primary)" />
                            <span>↑ v{updateInfo.latestVersion}</span>
                        </button>
                    </>
                )}
            </div>
        </footer>
    );
}
