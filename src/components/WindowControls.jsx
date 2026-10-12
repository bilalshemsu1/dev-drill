import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

export default function WindowControls() {
    const [isMaximized, setIsMaximized] = useState(false);
    const isDesktop = typeof window !== 'undefined' && Boolean(window.Neutralino?.window);

    useEffect(() => {
        if (!isDesktop) return;
        const checkMax = async () => {
            try {
                const max = await window.Neutralino.window.isMaximized();
                setIsMaximized(max);
            } catch {}
        };
        checkMax();

        if (window.Neutralino?.events) {
            const onMax = () => setIsMaximized(true);
            const onUnmax = () => setIsMaximized(false);
            window.Neutralino.events.on('windowMaximize', onMax);
            window.Neutralino.events.on('windowUnmaximize', onUnmax);
            return () => {
                try {
                    window.Neutralino.events.off('windowMaximize', onMax);
                    window.Neutralino.events.off('windowUnmaximize', onUnmax);
                } catch {}
            };
        }
    }, [isDesktop]);

    const handleMinimize = async () => {
        if (isDesktop) {
            try {
                await window.Neutralino.window.minimize();
            } catch (e) {
                console.warn('Minimize failed:', e);
            }
        }
    };

    const handleMaximizeToggle = async () => {
        if (isDesktop) {
            try {
                const max = await window.Neutralino.window.isMaximized();
                if (max) {
                    await window.Neutralino.window.unmaximize();
                    setIsMaximized(false);
                } else {
                    await window.Neutralino.window.maximize();
                    setIsMaximized(true);
                }
            } catch (e) {
                console.warn('Maximize toggle failed:', e);
            }
        } else {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                setIsMaximized(true);
            } else {
                document.exitFullscreen().catch(() => {});
                setIsMaximized(false);
            }
        }
    };

    const handleClose = async () => {
        if (isDesktop) {
            try {
                await window.Neutralino.app.exit();
            } catch (e) {
                console.warn('Exit failed:', e);
            }
        } else {
            window.close();
        }
    };

    return (
        <div
            className="window-controls"
            style={{
                display: 'flex',
                alignItems: 'center',
                height: '36px',
                WebkitAppRegion: 'no-drag',
                marginRight: '-0.85rem',
            }}
        >
            {/* Minimize */}
            <button
                onClick={handleMinimize}
                title="Minimize"
                style={{
                    width: '42px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <Minus size={12} strokeWidth={2} />
            </button>

            {/* Maximize / Restore */}
            <button
                onClick={handleMaximizeToggle}
                title={isMaximized ? 'Restore Down' : 'Maximize'}
                style={{
                    width: '42px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                {isMaximized ? <Copy size={11} strokeWidth={2} /> : <Square size={11} strokeWidth={2} />}
            </button>

            {/* Close */}
            <button
                onClick={handleClose}
                title="Close"
                style={{
                    width: '44px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = '#e81123';
                    e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }}
            >
                <X size={13} strokeWidth={2} />
            </button>
        </div>
    );
}
