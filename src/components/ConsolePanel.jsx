import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, XCircle, AlertCircle, Clock, Trophy, Repeat, Check, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { scheduleReview, getReviewRecord } from '../services/storage';

export default function ConsolePanel({ output, problemId, executionDetails }) {
    const isFinished = output && output.includes('Status:');
    const isAccepted = output && output.includes('Accepted');
    const isWrong = output && output.includes('Wrong Answer');
    const isRuntimeError = output && output.includes('Runtime Error');
    const isTLE = output && output.includes('Time Limit Exceeded');
    const isError = isRuntimeError || isTLE || (output && output.includes('Error'));

    const [scheduledMsg, setScheduledMsg] = useState(null);
    const [reviewRecord, setReviewRecord] = useState(null);
    const [showTestList, setShowTestList] = useState(true);
    const [consoleTab, setConsoleTab] = useState('output'); // 'output' | 'tests'

    useEffect(() => {
        if (problemId) {
            getReviewRecord(problemId).then(setReviewRecord);
            setScheduledMsg(null);
        }
    }, [problemId, isAccepted]);

    const handleSchedule = async (quality) => {
        if (!problemId) return;
        const rec = await scheduleReview(problemId, quality);
        setReviewRecord(rec);
        const days = rec.intervalDays;
        setScheduledMsg(`Scheduled for review in ${days} days (${rec.nextReviewDate})!`);
        setTimeout(() => setScheduledMsg(null), 3500);
    };

    // Extract runtime string and numeric value
    const runtimeMatch = output?.match(/Runtime:\s*([^\n\r]+)/);
    const runtimeStr = executionDetails?.runtime || (runtimeMatch ? runtimeMatch[1] : null);
    const rawTimeMs = executionDetails?.rawTimeMs !== undefined
        ? executionDetails.rawTimeMs
        : (parseFloat(runtimeStr) || 0);

    // Determine Performance & Complexity Tier
    let tierInfo = null;
    if (isAccepted) {
        if (rawTimeMs < 25) {
            tierInfo = {
                label: 'Optimal Runtime (Beats 95%+) • O(N) / O(N log N)',
                color: '#10b981',
                icon: Trophy,
            };
        } else if (rawTimeMs <= 180) {
            tierInfo = {
                label: 'Solid Runtime (Beats 65%) • Linearithmic',
                color: '#3b82f6',
                icon: CheckCircle2,
            };
        } else {
            tierInfo = {
                label: 'Runtime Optimization Needed • Suboptimal O(N²)',
                color: '#f59e0b',
                icon: Clock,
            };
        }
    } else if (isTLE) {
        tierInfo = {
            label: 'Time Limit Exceeded (>1200ms) • Suboptimal Complexity Detected',
            color: '#ef4444',
            icon: AlertCircle,
        };
    }

    const testResults = executionDetails?.results || [];

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
            {/* Desktop Console Header */}
            <div
                className="panel-header"
                style={{
                    height: '35px',
                    minHeight: '35px',
                    padding: '0 0.5rem',
                    borderBottom: '1px solid var(--bg-panel-border)',
                    background: 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                {/* Tabs: Output vs Test Cases */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', height: '100%' }}>
                    <button
                        onClick={() => setConsoleTab('output')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0 0.65rem',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: consoleTab === 'output' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: consoleTab === 'output' ? 600 : 500,
                            fontFamily: 'var(--font-sans)',
                            color: consoleTab === 'output' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <Terminal size={13} color={consoleTab === 'output' ? 'var(--accent-primary)' : 'currentColor'} />
                        <span>Console Output</span>
                    </button>

                    <button
                        onClick={() => setConsoleTab('tests')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0 0.65rem',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: consoleTab === 'tests' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: consoleTab === 'tests' ? 600 : 500,
                            fontFamily: 'var(--font-sans)',
                            color: consoleTab === 'tests' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <CheckCircle2 size={13} color={consoleTab === 'tests' ? 'var(--accent-primary)' : 'currentColor'} />
                        <span>Test Cases</span>
                        {testResults.length > 0 && (
                            <span
                                style={{
                                    fontSize: '0.68rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: testResults.every(t => t.passed) ? 'var(--success)' : 'var(--error)',
                                    fontWeight: 700,
                                }}
                            >
                                ({testResults.filter(t => t.passed).length}/{testResults.length})
                            </span>
                        )}
                    </button>
                </div>

                {reviewRecord && (
                    <div style={{ fontSize: '0.74rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                        <Repeat size={12} /> Next: {reviewRecord.nextReviewDate}
                    </div>
                )}
            </div>
            <div className="panel-content" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {!output ? (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>
                        Run your code to see verification & benchmark timing here
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                        {/* Status Header */}
                        {isFinished && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                flexWrap: 'wrap', gap: '0.5rem',
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    color: isAccepted ? 'var(--success)' : isError || isWrong ? 'var(--error)' : 'var(--text-primary)',
                                    fontSize: '1.2rem', fontWeight: '700'
                                }}>
                                    {isAccepted && <CheckCircle2 size={22} />}
                                    {isWrong && <XCircle size={22} />}
                                    {isError && <AlertCircle size={22} />}
                                    {!isAccepted && !isWrong && !isError && <Clock size={22} />}

                                    {isAccepted ? 'Accepted' :
                                        isWrong ? 'Wrong Answer' :
                                            isTLE ? 'Time Limit Exceeded' :
                                                isRuntimeError ? 'Runtime Error' :
                                                    isError ? 'Error' : 'Finished'}
                                </div>

                                {/* Spaced Repetition Buttons when Accepted */}
                                {isAccepted && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginRight: '2px' }}>
                                            Review in:
                                        </span>
                                        <button
                                            onClick={() => handleSchedule('hard')}
                                            title="Schedule review in 2 days"
                                            style={{
                                                padding: '2px 8px', borderRadius: '5px',
                                                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                                            }}
                                        >
                                            2d (Hard)
                                        </button>
                                        <button
                                            onClick={() => handleSchedule('good')}
                                            title="Schedule review in 5 days"
                                            style={{
                                                padding: '2px 8px', borderRadius: '5px',
                                                background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
                                                color: '#60a5fa', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                                            }}
                                        >
                                            5d (Good)
                                        </button>
                                        <button
                                            onClick={() => handleSchedule('easy')}
                                            title="Schedule review in 14 days"
                                            style={{
                                                padding: '2px 8px', borderRadius: '5px',
                                                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                                color: '#10b981', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                                            }}
                                        >
                                            14d (Easy)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {scheduledMsg && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.4rem 0.75rem', borderRadius: '6px',
                                background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)',
                                color: '#10b981', fontSize: '0.76rem', fontWeight: 600,
                            }}>
                                <Check size={13} />
                                <span>{scheduledMsg}</span>
                            </div>
                        )}

                        {/* Performance & Complexity Tier */}
                        {tierInfo && (
                            <div style={{
                                padding: '0.65rem 0.85rem',
                                borderRadius: '8px',
                                background: `${tierInfo.color}15`,
                                border: `1px solid ${tierInfo.color}40`,
                                color: tierInfo.color,
                                fontWeight: '600',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <tierInfo.icon size={16} />
                                    <span style={{ fontSize: '0.82rem' }}>{tierInfo.label}</span>
                                </div>
                                <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                                    {runtimeStr || `${rawTimeMs}ms`}
                                </span>
                            </div>
                        )}

                        {/* Tab Content: Tests Tab */}
                        {consoleTab === 'tests' && (
                            testResults.length > 0 ? (
                                <div style={{
                                    border: '1px solid var(--bg-panel-border)',
                                    borderRadius: '6px',
                                    background: 'var(--bg-panel)',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.45rem 0.75rem',
                                        background: 'rgba(0, 0, 0, 0.08)',
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        fontFamily: 'var(--font-mono)',
                                    }}>
                                        <span>TEST CASES VERIFICATION</span>
                                        <span style={{ color: testResults.every(t => t.passed) ? 'var(--success)' : 'var(--error)' }}>
                                            {testResults.filter(t => t.passed).length}/{testResults.length} PASSED
                                        </span>
                                    </div>

                                    <div style={{ padding: '0.4rem' }}>
                                        {testResults.map((tr, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '0.35rem 0.55rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    marginBottom: '2px',
                                                    background: tr.passed ? 'transparent' : 'rgba(239, 68, 68, 0.08)',
                                                    borderLeft: tr.passed ? '2px solid #10b981' : '2px solid #ef4444',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {tr.passed ? (
                                                        <CheckCircle2 size={13} color="#10b981" />
                                                    ) : (
                                                        <XCircle size={13} color="#ef4444" />
                                                    )}
                                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        Case {idx + 1}
                                                        {idx === testResults.length - 1 && testResults.length >= 4 && (
                                                            <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#a855f7', fontWeight: 600 }}>
                                                                [Stress Scale]
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {tr.durationMs !== undefined && (
                                                        <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                                                            {tr.durationMs < 1 ? '<1ms' : `${tr.durationMs.toFixed(1)}ms`}
                                                        </span>
                                                    )}
                                                    <span style={{
                                                        color: tr.passed ? '#10b981' : '#ef4444',
                                                        fontWeight: 600,
                                                        fontSize: '0.72rem',
                                                    }}>
                                                        {tr.passed ? 'Passed' : 'Failed'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    color: 'var(--text-tertiary)',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-mono)',
                                }}>
                                    No granular test case breakdown available for this run.
                                </div>
                            )
                        )}

                        {/* Tab Content: Output Logs Tab */}
                        {consoleTab === 'output' && (
                            <div style={{
                                background: 'var(--bg-main)',
                                padding: '0.85rem',
                                borderRadius: '6px',
                                overflowY: 'auto',
                                maxHeight: '280px',
                                border: '1px solid var(--bg-panel-border)',
                            }}>
                                <pre style={{
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontSize: '0.82rem',
                                    lineHeight: 1.6,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    margin: 0,
                                }}>
                                    {output}
                                </pre>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
