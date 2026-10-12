import React, { useState, useEffect } from 'react';
import { FileText, Lightbulb, Code2, BookMarked, Save, Download, Lock } from 'lucide-react';
import { getNote, saveNote } from '../services/storage';

const DIFF_COLOR = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
const DIFF_BG = { Easy: 'rgba(16,185,129,0.15)', Medium: 'rgba(245,158,11,0.15)', Hard: 'rgba(239,68,68,0.15)' };

export default function ProblemPanel({ problem, language }) {
    const [tab, setTab] = useState('description');
    const [revealedHints, setRevealedHints] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const [note, setNote] = useState('');
    const [noteSaved, setNoteSaved] = useState(false);

    // Reset hint/solution and load note when problem changes
    useEffect(() => {
        setTab('description');
        setRevealedHints(0);
        setShowSolution(false);
        if (problem?.id) {
            getNote(problem.id).then(text => setNote(text || ''));
        }
    }, [problem?.id]);

    if (!problem) return null;

    const hints = problem.hints || [];
    const solution = problem.optimalSolution?.[language] || problem.optimalSolution?.python || '';

    const handleSaveNote = async () => {
        if (!problem?.id) return;
        await saveNote(problem.id, note);
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2000);
    };

    const handleExportNote = () => {
        const content = `# Problem ${problem.id}: ${problem.title}\nDifficulty: ${problem.difficulty}\nTopic: ${problem.topic || 'Algorithms'}\n\n## Pattern & Solution Notes\n${note}\n`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DevDrill_${problem.id}_${problem.title.replace(/\s+/g, '_')}_Notes.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const tabs = [
        { id: 'description', label: 'Description', icon: FileText },
        { id: 'hints', label: 'Hints', icon: Lightbulb },
        { id: 'solution', label: 'Solution', icon: Code2 },
        { id: 'notes', label: 'My Notes', icon: BookMarked },
    ];

    return (
        <div
            className="panel workspace-panel"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: 'none',
                borderRadius: 0,
                background: 'var(--bg-main)',
            }}
        >
            {/* Desktop Tab Bar */}
            <div
                className="panel-header"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 0.5rem',
                    height: '35px',
                    minHeight: '35px',
                    gap: '0.15rem',
                    flexShrink: 0,
                    borderBottom: '1px solid var(--bg-panel-border)',
                    background: 'var(--bg-main)',
                }}
            >
                {tabs.map(({ id, label, icon: Icon }) => {
                    const isActive = tab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0 0.65rem',
                                height: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: isActive ? 600 : 500,
                                fontFamily: 'var(--font-sans)',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            <Icon size={13} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
                            <span>{label}</span>
                            {id === 'hints' && hints.length > 0 && (
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        fontFamily: 'var(--font-mono)',
                                        opacity: 0.7,
                                    }}
                                >
                                    ({hints.length})
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="panel-content" style={{ flex: 1, overflowY: 'auto' }}>
                {tab === 'description' && (
                    <>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.6rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {problem.id}. {problem.title}
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <span style={{
                                background: DIFF_BG[problem.difficulty],
                                color: DIFF_COLOR[problem.difficulty],
                                padding: '2px 10px', borderRadius: '12px',
                                fontSize: '0.75rem', fontWeight: 600,
                            }}>
                                {problem.difficulty}
                            </span>
                            {problem.topic && (
                                <span style={{
                                    background: 'var(--bg-panel-border)',
                                    color: 'var(--text-secondary)',
                                    padding: '2px 10px', borderRadius: '12px',
                                    fontSize: '0.75rem', fontWeight: 500,
                                }}>
                                    {problem.topic}
                                </span>
                            )}
                        </div>
                        <div
                            className="problem-description"
                            style={{ color: 'var(--text-primary)', fontSize: '0.93rem', lineHeight: '1.65' }}
                            dangerouslySetInnerHTML={{ __html: problem.description }}
                        />
                    </>
                )}

                {tab === 'hints' && (
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.2rem', lineHeight: 1.5 }}>
                            Reveal hints one at a time. Try to solve the problem before looking!
                        </p>

                        {hints.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No hints available for this problem.</p>
                        )}

                        {hints.map((hint, idx) => {
                            const isRevealed = idx < revealedHints;
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        marginBottom: '0.75rem',
                                        borderRadius: '8px',
                                        border: isRevealed ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--bg-panel-border)',
                                        background: isRevealed ? 'rgba(245, 158, 11, 0.06)' : 'rgba(128, 128, 128, 0.05)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {isRevealed ? (
                                        <div style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--warning, #f59e0b)', fontWeight: 700, marginBottom: '0.3rem' }}>
                                                Hint {idx + 1}
                                            </div>
                                            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                                                {hint}
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setRevealedHints(idx + 1)}
                                            disabled={idx !== revealedHints}
                                            style={{
                                                width: '100%',
                                                padding: '0.65rem 1rem',
                                                background: 'none',
                                                border: 'none',
                                                color: idx === revealedHints ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                                cursor: idx === revealedHints ? 'pointer' : 'not-allowed',
                                                fontSize: '0.83rem',
                                                fontWeight: 500,
                                                textAlign: 'left',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <span>Hint {idx + 1}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary, #3b82f6)', fontWeight: 600 }}>Click to reveal</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === 'solution' && (
                    <div>
                        {!showSolution ? (
                            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '50%',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--accent-primary, #3b82f6)',
                                    marginBottom: '1rem',
                                }}>
                                    <Lock size={26} />
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                                    Optimal Solution Hidden
                                </h3>
                                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                                    Try solving it on your own first! Reading the solution early reduces learning retention.
                                </p>
                                <button
                                    onClick={() => setShowSolution(true)}
                                    style={{
                                        padding: '0.6rem 1.5rem',
                                        background: 'rgba(59,130,246,0.12)',
                                        border: '1px solid rgba(59,130,246,0.35)',
                                        borderRadius: '8px', cursor: 'pointer',
                                        color: 'var(--accent-primary, #3b82f6)', fontSize: '0.88rem',
                                        fontFamily: 'var(--font-sans)', fontWeight: 600,
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.22)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
                                >
                                    Show Optimal Solution
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: '0.75rem',
                                }}>
                                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                                        Optimal Solution — {language === 'javascript' ? 'JavaScript' : 'Python'}
                                    </span>
                                    <button
                                        onClick={() => setShowSolution(false)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--text-tertiary)', fontSize: '0.78rem',
                                            fontFamily: 'var(--font-sans)', padding: '2px 6px',
                                        }}
                                    >
                                        Hide
                                    </button>
                                </div>
                                <pre style={{
                                    background: 'var(--bg-main)',
                                    border: '1px solid var(--bg-panel-border)',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    overflowX: 'auto',
                                    fontSize: '0.82rem',
                                    lineHeight: 1.7,
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-mono, monospace)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}>
                                    {solution}
                                </pre>
                                <p style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
                                    Switch language in the editor panel to see the {language === 'python' ? 'JavaScript' : 'Python'} solution.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'notes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={handleExportNote}
                                title="Export Note to Markdown (.md)"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.3rem 0.65rem', borderRadius: '6px',
                                    background: 'var(--bg-panel-border)',
                                    border: '1px solid var(--bg-panel-border)',
                                    color: 'var(--text-secondary)', fontSize: '0.76rem',
                                    cursor: 'pointer',
                                }}
                            >
                                <Download size={13} /> Export .md
                            </button>
                            <button
                                onClick={handleSaveNote}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.3rem 0.75rem', borderRadius: '6px',
                                    background: noteSaved ? '#10b981' : '#3b82f6',
                                    border: 'none', color: 'white',
                                    fontSize: '0.76rem', fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                }}
                            >
                                <Save size={13} /> {noteSaved ? 'Saved!' : 'Save Note'}
                            </button>
                        </div>

                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Write your personal notes for this problem...&#10;&#10;Key Pattern: (e.g. Two Pointers / Sliding Window)&#10;Edge Cases: (e.g. Empty list, negative numbers)&#10;Complexity: Time O(N), Space O(1)"
                            style={{
                                flex: 1,
                                minHeight: '260px',
                                width: '100%',
                                background: 'var(--bg-main)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono, monospace)',
                                fontSize: '0.85rem',
                                lineHeight: '1.6',
                                resize: 'vertical',
                                outline: 'none',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
