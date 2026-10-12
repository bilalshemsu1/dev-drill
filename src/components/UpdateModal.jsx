import React, { useState } from 'react';
import { ArrowUpCircle, CheckCircle2, X, RefreshCw, Sparkles, Terminal } from 'lucide-react';
import { installUpdate } from '../services/updaterService';

export default function UpdateModal({ updateInfo, onClose }) {
    const [installing, setInstalling] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState(null);

    const handleInstall = async () => {
        setInstalling(true);
        setError(null);
        try {
            await installUpdate(updateInfo, (msg) => {
                setStatusMessage(msg);
            });
        } catch (err) {
            setInstalling(false);
            setError(err?.message || 'Failed to install update. Please check network.');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.15s ease',
        }}>
            <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--bg-panel-border)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '460px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
                overflow: 'hidden',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
            }}>
                {/* Modal Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.25rem',
                    borderBottom: '1px solid var(--bg-panel-border)',
                    background: 'var(--bg-panel)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowUpCircle size={16} color="#3b82f6" />
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                        }}>
                            SYSTEM UPDATE
                        </span>
                    </div>

                    {!installing && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-tertiary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.25rem' }}>
                    {/* Version Badge Comparison */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--bg-panel-border)',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                    }}>
                        <div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>CURRENT</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.9rem' }}>
                                v{updateInfo?.currentVersion || '1.0.0'}
                            </div>
                        </div>

                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>➔</div>

                        <div>
                            <div style={{ fontSize: '0.68rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>NEW VERSION</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', color: '#10b981' }}>
                                v{updateInfo?.latestVersion || '1.0.1'}
                            </div>
                        </div>
                    </div>

                    {/* Changelog / Notes */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                            Release Highlights
                        </div>
                        <div style={{
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                            color: 'var(--text-secondary)',
                            background: 'rgba(0, 0, 0, 0.1)',
                            border: '1px solid var(--bg-panel-border)',
                            borderRadius: '6px',
                            padding: '0.75rem',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '140px',
                            overflowY: 'auto',
                        }}>
                            {updateInfo?.releaseNotes || 'Includes latest algorithmic test enhancements, performance updates, and offline engine improvements.'}
                        </div>
                    </div>

                    {/* Progress / Status feedback */}
                    {installing && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.65rem',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#3b82f6',
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-mono)',
                            marginBottom: '1rem',
                        }}>
                            <RefreshCw size={14} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                            <span>{statusMessage || 'Preparing update...'}</span>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '0.65rem',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            fontSize: '0.78rem',
                            marginBottom: '1rem',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                        {!installing && (
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '0.45rem 0.9rem',
                                    borderRadius: '6px',
                                    background: 'transparent',
                                    border: '1px solid var(--bg-panel-border)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Remind Me Later
                            </button>
                        )}

                        <button
                            onClick={handleInstall}
                            disabled={installing}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.45rem 1.1rem',
                                borderRadius: '6px',
                                background: 'var(--text-primary)',
                                color: 'var(--bg-main)',
                                border: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: installing ? 'not-allowed' : 'pointer',
                                opacity: installing ? 0.7 : 1,
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <RefreshCw size={13} />
                            <span>{installing ? 'Updating...' : 'Update & Restart'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
