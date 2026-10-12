import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import WindowControls from './WindowControls';

export default function DesktopTitleBar({
    children,
    subtitle,
    actions,
}) {
    const navigate = useNavigate();

    return (
        <header
            className="app-header desktop-titlebar"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.85rem',
                height: '36px',
                minHeight: '36px',
                background: 'var(--bg-main)',
                borderBottom: '1px solid var(--bg-panel-border)',
                WebkitAppRegion: 'drag',
                userSelect: 'none',
                zIndex: 50,
            }}
        >
            {/* Left: Brand + Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', WebkitAppRegion: 'no-drag' }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                    title="DevDrill Home"
                >
                    <img src="/logo.svg" alt="DevDrill" style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        DevDrill
                    </span>
                </div>

                {subtitle && (
                    <>
                        <div style={{ width: '1px', height: '14px', background: 'var(--bg-panel-border)' }} />
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
                            {subtitle}
                        </span>
                    </>
                )}
            </div>

            {/* Center: Custom Page Content (e.g. Problem Selector) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 0, padding: '0 1rem', WebkitAppRegion: 'no-drag' }}>
                {children}
            </div>

            {/* Right: Actions + Theme + Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0, WebkitAppRegion: 'no-drag' }}>
                {actions}
                <ThemeToggle />
                <div style={{ width: '1px', height: '14px', background: 'var(--bg-panel-border)', margin: '0 0.15rem' }} />
                <WindowControls />
            </div>
        </header>
    );
}
