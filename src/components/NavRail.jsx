import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Code2, Activity, Settings, ArrowUpCircle } from 'lucide-react';

export default function NavRail({ onOpenUpdate, updateInfo, streak = 0 }) {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

    const navItems = [
        {
            id: 'editor',
            path: '/editor',
            label: 'Coding Workspace [Ctrl+1]',
            icon: Code2,
            isActive: path === '/editor',
        },
        {
            id: 'catalog',
            path: '/',
            label: 'Problem Library [Ctrl+2]',
            icon: LayoutGrid,
            isActive: path === '/' || path === '/problems',
        },
        {
            id: 'stats',
            path: '/stats',
            label: `Activity & Analytics (${streak}d streak) [Ctrl+3]`,
            icon: Activity,
            isActive: path === '/stats',
        },
        {
            id: 'settings',
            path: '/settings',
            label: 'Settings & Customization [Ctrl+,]',
            icon: Settings,
            isActive: path === '/settings',
        },
    ];

    return (
        <aside
            className="nav-rail"
            style={{
                width: '42px',
                minWidth: '42px',
                height: '100%',
                background: 'var(--bg-main)',
                borderRight: '1px solid var(--bg-panel-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                userSelect: 'none',
                zIndex: 15,
            }}
        >
            {/* Top Navigation Items */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            title={item.label}
                            style={{
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: item.isActive ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                color: item.isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (!item.isActive) {
                                    e.currentTarget.style.background = 'var(--bg-panel)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!item.isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            <Icon size={17} />
                            {/* Active pip on left */}
                            {item.isActive && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        left: '-5px',
                                        width: '3px',
                                        height: '14px',
                                        borderRadius: '0 2px 2px 0',
                                        background: 'var(--accent-primary)',
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Bottom Actions: Update Notification */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                {updateInfo?.hasUpdate && (
                    <button
                        onClick={onOpenUpdate}
                        title={`New update v${updateInfo.latestVersion} available! Click to install.`}
                        style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            position: 'relative',
                        }}
                    >
                        <ArrowUpCircle size={17} />
                        <span
                            style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#3b82f6',
                                boxShadow: '0 0 6px #3b82f6',
                            }}
                        />
                    </button>
                )}
            </div>
        </aside>
    );
}
