import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DesktopTitleBar from '../components/DesktopTitleBar';
import NavRail from '../components/NavRail';
import UpdateModal from '../components/UpdateModal';
import { exportAllData, importAllData, resetAllData, getActivityData } from '../services/storage';
import { checkForUpdate, CURRENT_VERSION } from '../services/updaterService';
import {
    Settings as SettingsIcon,
    Code2,
    Database,
    Download,
    Upload,
    Trash2,
    Keyboard,
    Check,
    AlertTriangle,
    ArrowUpCircle,
    Sun,
    Moon,
    Laptop,
} from 'lucide-react';

export default function Settings() {
    const navigate = useNavigate();

    // Editor settings state
    const [fontSize, setFontSize] = useState(() => localStorage.getItem('devdrill_editor_fontsize') || '14');
    const [contentFontSize, setContentFontSize] = useState(() => localStorage.getItem('devdrill_content_fontsize') || '15');
    const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('devdrill_editor_fontfamily') || "'JetBrains Mono', monospace");
    const [tabSize, setTabSize] = useState(() => localStorage.getItem('devdrill_editor_tabsize') || '4');
    const [minimap, setMinimap] = useState(() => localStorage.getItem('devdrill_editor_minimap') === 'true');
    const [wordWrap, setWordWrap] = useState(() => localStorage.getItem('devdrill_editor_wordwrap') !== 'false');
    const [lineNumbers, setLineNumbers] = useState(() => localStorage.getItem('devdrill_editor_linenumbers') !== 'false');

    // Theme state
    const [theme, setTheme] = useState(() => localStorage.getItem('offcode_theme') || 'dark');

    // Stats and update
    const [activityStats, setActivityStats] = useState(null);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [saveNotice, setSaveNotice] = useState(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const [checkingUpdate, setCheckingUpdate] = useState(false);

    useEffect(() => {
        getActivityData().then(setActivityStats);
        checkForUpdate().then(res => {
            if (res && res.hasUpdate) setUpdateInfo(res);
        });
    }, []);

    const showSaved = (msg = 'Settings saved') => {
        setSaveNotice(msg);
        setTimeout(() => setSaveNotice(null), 2500);
    };

    const notifySettingsChanged = () => {
        window.dispatchEvent(new CustomEvent('devdrill_settings_updated'));
    };

    const handleFontSizeChange = (sz) => {
        setFontSize(sz);
        localStorage.setItem('devdrill_editor_fontsize', sz);
        document.documentElement.style.setProperty('--editor-font-size', `${sz}px`);
        notifySettingsChanged();
        showSaved(`Editor font size set to ${sz}px`);
    };

    const handleContentFontSizeChange = (sz) => {
        setContentFontSize(sz);
        localStorage.setItem('devdrill_content_fontsize', sz);
        document.documentElement.style.setProperty('--problem-font-size', `${sz}px`);
        notifySettingsChanged();
        showSaved(`Problem reading size set to ${sz}px`);
    };

    const handleFontFamilyChange = (fam) => {
        setFontFamily(fam);
        localStorage.setItem('devdrill_editor_fontfamily', fam);
        document.documentElement.style.setProperty('--font-mono', fam);
        notifySettingsChanged();
        showSaved('Editor font family updated');
    };

    const handleTabSizeChange = (ts) => {
        setTabSize(ts);
        localStorage.setItem('devdrill_editor_tabsize', ts);
        notifySettingsChanged();
        showSaved(`Tab size set to ${ts} spaces`);
    };

    const handleMinimapToggle = () => {
        const next = !minimap;
        setMinimap(next);
        localStorage.setItem('devdrill_editor_minimap', String(next));
        notifySettingsChanged();
        showSaved(`Minimap ${next ? 'enabled' : 'disabled'}`);
    };

    const handleWordWrapToggle = () => {
        const next = !wordWrap;
        setWordWrap(next);
        localStorage.setItem('devdrill_editor_wordwrap', String(next));
        notifySettingsChanged();
        showSaved(`Word wrap ${next ? 'enabled' : 'disabled'}`);
    };

    const handleLineNumbersToggle = () => {
        const next = !lineNumbers;
        setLineNumbers(next);
        localStorage.setItem('devdrill_editor_linenumbers', String(next));
        notifySettingsChanged();
        showSaved(`Line numbers ${next ? 'enabled' : 'disabled'}`);
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('offcode_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        showSaved(`Theme changed to ${newTheme === 'dark' ? 'Dark' : 'Light'}`);
    };

    // Export Data
    const handleExport = async () => {
        try {
            const data = await exportAllData();
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `devdrill-backup-${dateStr}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showSaved('Backup exported successfully');
        } catch (e) {
            alert('Export failed: ' + e.message);
        }
    };

    // Import Data
    const handleImportFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);
                await importAllData(json);
                showSaved('Backup restored! Reloading...');
                setTimeout(() => window.location.reload(), 1200);
            } catch (err) {
                alert('Invalid backup file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Reset Data
    const handleReset = async () => {
        if (!confirmReset) {
            setConfirmReset(true);
            return;
        }
        await resetAllData();
        setConfirmReset(false);
        showSaved('Progress reset. Reloading...');
        setTimeout(() => window.location.reload(), 1200);
    };

    const handleCheckUpdate = async () => {
        setCheckingUpdate(true);
        const res = await checkForUpdate();
        setCheckingUpdate(false);
        if (res && res.hasUpdate) {
            setUpdateInfo(res);
            setShowUpdateModal(true);
        } else {
            showSaved(`DevDrill is up to date (v${CURRENT_VERSION})`);
        }
    };

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-main)', overflow: 'hidden' }}>
            {/* Unified 36px Desktop Titlebar */}
            <DesktopTitleBar
                subtitle="/ Settings & Preferences"
                actions={
                    saveNotice && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.74rem',
                            color: 'var(--success)',
                            fontFamily: 'var(--font-mono)',
                            padding: '0.1rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.1)',
                        }}>
                            <Check size={12} />
                            <span>{saveNotice}</span>
                        </div>
                    )
                }
            />

            {/* Desktop Body */}
            <div className="desktop-body" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <NavRail
                    onOpenHeatmap={() => navigate('/stats')}
                    onOpenUpdate={() => setShowUpdateModal(true)}
                    updateInfo={updateInfo}
                    streak={activityStats?.currentStreak || 0}
                />

                {/* Settings Content Area */}
                <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ maxWidth: '820px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                        {/* Page Header */}
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                                Settings & Customization
                            </h1>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                                Configure your Monaco code editor, appearance, backups, and keybindings.
                            </p>
                        </div>

                        {/* SECTION 1: Editor Preferences */}
                        <section style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--bg-panel-border)',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--bg-panel-border)', paddingBottom: '0.75rem' }}>
                                <Code2 size={16} color="var(--accent-primary)" />
                                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Code Editor Preferences
                                </h2>
                            </div>

                            {/* Font Size */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>Font Size</div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Controls the Monaco editor font size in pixels</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    {['12', '14', '16', '18', '20'].map(sz => (
                                        <button
                                            key={sz}
                                            onClick={() => handleFontSizeChange(sz)}
                                            style={{
                                                padding: '0.3rem 0.65rem',
                                                borderRadius: '5px',
                                                border: `1px solid ${fontSize === sz ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}`,
                                                background: fontSize === sz ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                                color: fontSize === sz ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                fontSize: '0.78rem',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {sz}px
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Family */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>Font Family</div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Monospace typeface inside code blocks</div>
                                </div>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => handleFontFamilyChange(e.target.value)}
                                    className="custom-select"
                                    style={{ padding: '0.3rem 2rem 0.3rem 0.75rem', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
                                >
                                    <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                                    <option value="'Fira Code', monospace">Fira Code</option>
                                    <option value="Menlo, Monaco, monospace">Menlo / Monaco</option>
                                    <option value="'Courier New', monospace">Courier New</option>
                                </select>
                            </div>

                            {/* Tab Size */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tab Indentation</div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Number of spaces per indentation level</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    {['2', '4'].map(ts => (
                                        <button
                                            key={ts}
                                            onClick={() => handleTabSizeChange(ts)}
                                            style={{
                                                padding: '0.3rem 0.75rem',
                                                borderRadius: '5px',
                                                border: `1px solid ${tabSize === ts ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}`,
                                                background: tabSize === ts ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                                color: tabSize === ts ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                fontSize: '0.78rem',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {ts} spaces
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles: Minimap, Word Wrap, Line Numbers */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', paddingTop: '0.5rem' }}>
                                <button
                                    onClick={handleMinimapToggle}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '6px',
                                        border: `1px solid ${minimap ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}`,
                                        background: minimap ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Minimap</span>
                                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: minimap ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                                        {minimap ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </button>

                                <button
                                    onClick={handleWordWrapToggle}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '6px',
                                        border: `1px solid ${wordWrap ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}`,
                                        background: wordWrap ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Word Wrap</span>
                                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: wordWrap ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                                        {wordWrap ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </button>

                                <button
                                    onClick={handleLineNumbersToggle}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '6px',
                                        border: `1px solid ${lineNumbers ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}`,
                                        background: lineNumbers ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Line Numbers</span>
                                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: lineNumbers ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                                        {lineNumbers ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </button>
                            </div>

                            {/* Live Code Preview Box */}
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                borderRadius: '8px',
                                border: '1px solid var(--bg-panel-border)',
                                padding: '0.85rem 1rem',
                                marginTop: '0.35rem',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                            LIVE EDITOR PREVIEW — {fontSize}px · {fontFamily.split(',')[0].replace(/'/g, '')} · Tab: {tabSize}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>● Instant Applied</span>
                                </div>
                                <div style={{
                                    fontFamily: fontFamily,
                                    fontSize: `${fontSize}px`,
                                    lineHeight: 1.6,
                                    color: 'var(--text-primary)',
                                    background: 'var(--bg-main)',
                                    padding: '0.85rem 1rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--bg-panel-border)',
                                    overflowX: 'auto',
                                }}>
                                    <div><span style={{ color: '#f43f5e', fontWeight: 600 }}>def</span> <span style={{ color: '#60a5fa', fontWeight: 600 }}>twoSum</span>(nums: <span style={{ color: '#38bdf8' }}>list[int]</span>, target: <span style={{ color: '#38bdf8' }}>int</span>) -&gt; <span style={{ color: '#38bdf8' }}>list[int]</span>:</div>
                                    <div style={{ paddingLeft: `${Number(tabSize) * 0.55}rem` }}><span style={{ color: 'var(--text-tertiary)' }}># Hash map lookup: O(n) runtime</span></div>
                                    <div style={{ paddingLeft: `${Number(tabSize) * 0.55}rem` }}>seen = {'{}'}</div>
                                    <div style={{ paddingLeft: `${Number(tabSize) * 0.55}rem` }}><span style={{ color: '#f43f5e', fontWeight: 600 }}>for</span> i, num <span style={{ color: '#f43f5e', fontWeight: 600 }}>in</span> <span style={{ color: '#fbbf24' }}>enumerate</span>(nums):</div>
                                    <div style={{ paddingLeft: `${Number(tabSize) * 1.1}rem` }}>complement = target - num</div>
                                    <div style={{ paddingLeft: `${Number(tabSize) * 1.1}rem` }}><span style={{ color: '#f43f5e', fontWeight: 600 }}>if</span> complement <span style={{ color: '#f43f5e', fontWeight: 600 }}>in</span> seen:</div>
                                    <div style={{ paddingLeft: `${Number(tabSize) * 1.65}rem` }}><span style={{ color: '#f43f5e', fontWeight: 600 }}>return</span> [seen[complement], i]</div>
                                    <div style={{ paddingLeft: `${Number(tabSize) * 1.1}rem` }}>seen[num] = i</div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 2: Appearance & Theme */}
                        <section style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--bg-panel-border)',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--bg-panel-border)', paddingBottom: '0.75rem' }}>
                                <Sun size={16} color="#eab308" />
                                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Appearance & Reading Size
                                </h2>
                            </div>

                            {/* Theme Mode */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>Theme Mode</div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Switch between high-contrast dark mode and clean light mode</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleThemeChange('dark')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.85rem',
                                            borderRadius: '6px',
                                            border: `1px solid ${theme === 'dark' ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}`,
                                            background: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                            color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Moon size={13} />
                                        <span>Dark</span>
                                    </button>

                                    <button
                                        onClick={() => handleThemeChange('light')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.85rem',
                                            borderRadius: '6px',
                                            border: `1px solid ${theme === 'light' ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}`,
                                            background: theme === 'light' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                            color: theme === 'light' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Sun size={13} />
                                        <span>Light</span>
                                    </button>
                                </div>
                            </div>

                            {/* Problem & Text Reading Size */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bg-panel-border)', paddingTop: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>Problem Reading Size</div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Adjust font size for problem statements, examples, and hints</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    {[
                                        { sz: '13', label: 'Compact (13px)' },
                                        { sz: '15', label: 'Standard (15px)' },
                                        { sz: '17', label: 'Large (17px)' },
                                        { sz: '19', label: 'Comfort (19px)' },
                                    ].map(({ sz, label }) => (
                                        <button
                                            key={sz}
                                            onClick={() => handleContentFontSizeChange(sz)}
                                            style={{
                                                padding: '0.3rem 0.65rem',
                                                borderRadius: '5px',
                                                border: `1px solid ${contentFontSize === sz ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}`,
                                                background: contentFontSize === sz ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                                color: contentFontSize === sz ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                fontSize: '0.76rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Live Reading Sample Preview */}
                            <div style={{
                                background: 'var(--bg-main)',
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid var(--bg-panel-border)',
                                fontSize: `${contentFontSize}px`,
                                color: 'var(--text-primary)',
                                lineHeight: 1.6,
                            }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                                    PROBLEM STATEMENT PREVIEW:
                                </div>
                                <div>
                                    Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.
                                </div>
                            </div>
                        </section>

                        {/* SECTION 3: Data & Offline Backup */}
                        <section style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--bg-panel-border)',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--bg-panel-border)', paddingBottom: '0.75rem' }}>
                                <Database size={16} color="var(--success)" />
                                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Offline Storage & Backup
                                </h2>
                            </div>

                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                DevDrill stores all your solved status, written code, activity heatmaps, and pattern notes locally using persistent IndexedDB and native Neutralino disk sync. You can create a portable JSON snapshot at any time.
                            </p>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleExport}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <Download size={14} />
                                    <span>Export All Data (.json)</span>
                                </button>

                                <label
                                    className="btn btn-secondary"
                                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                                >
                                    <Upload size={14} />
                                    <span>Restore Backup</span>
                                    <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
                                </label>

                                <button
                                    onClick={handleReset}
                                    style={{
                                        padding: '0.45rem 0.85rem',
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        borderRadius: '7px',
                                        border: `1px solid ${confirmReset ? 'var(--error)' : 'var(--bg-panel-border)'}`,
                                        background: confirmReset ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                        color: confirmReset ? 'var(--error)' : 'var(--text-tertiary)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {confirmReset ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                                    <span>{confirmReset ? 'Click to Confirm Reset' : 'Reset All Progress'}</span>
                                </button>
                            </div>
                        </section>

                        {/* SECTION 4: Keyboard Shortcuts */}
                        <section style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--bg-panel-border)',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--bg-panel-border)', paddingBottom: '0.75rem' }}>
                                <Keyboard size={16} color="#f59e0b" />
                                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Desktop Keyboard Shortcuts
                                </h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                                {[
                                    { key: 'Ctrl + 1', desc: 'Switch to Coding Workspace' },
                                    { key: 'Ctrl + 2', desc: 'Switch to Problem Library' },
                                    { key: 'Ctrl + 3', desc: 'Switch to Analytics & Stats' },
                                    { key: 'Ctrl + ,', desc: 'Switch to Settings & Preferences' },
                                    { key: 'Ctrl + Enter', desc: 'Run code test cases' },
                                    { key: 'Ctrl + Shift + Enter', desc: 'Submit and verify solution' },
                                    { key: 'Alt + Left', desc: 'Navigate to previous problem' },
                                    { key: 'Alt + Right', desc: 'Navigate to next problem' },
                                    { key: 'Ctrl + R', desc: 'Refresh desktop application' },
                                ].map((sc, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.45rem 0.65rem',
                                            borderRadius: '6px',
                                            background: 'rgba(0, 0, 0, 0.1)',
                                            border: '1px solid var(--bg-panel-border)',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sc.desc}</span>
                                        <kbd style={{
                                            padding: '0.15rem 0.45rem',
                                            borderRadius: '4px',
                                            background: 'var(--bg-main)',
                                            border: '1px solid var(--bg-panel-border)',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.72rem',
                                            color: 'var(--text-primary)',
                                            fontWeight: 600,
                                        }}>
                                            {sc.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SECTION 5: About & Software Updates */}
                        <section style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--bg-panel-border)',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem',
                        }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    DevDrill Desktop v{CURRENT_VERSION}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                                    Ultra-lightweight offline competitive programming & interview workbench
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={handleCheckUpdate}
                                    disabled={checkingUpdate}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                    <ArrowUpCircle size={13} />
                                    <span>{checkingUpdate ? 'Checking...' : 'Check for Updates'}</span>
                                </button>
                                <a
                                    href="https://github.com/bilalshemsu1/dev-drill"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary"
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', textDecoration: 'none' }}
                                >
                                    GitHub
                                </a>
                            </div>
                        </section>

                    </div>
                </main>
            </div>

            {showUpdateModal && updateInfo && (
                <UpdateModal updateInfo={updateInfo} onClose={() => setShowUpdateModal(false)} />
            )}

            {/* Status Bar */}
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
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <SettingsIcon size={12} color="var(--accent-primary)" />
                    <span>Preferences & Customization</span>
                </div>
                <div>
                    <span>DevDrill v{CURRENT_VERSION} · OFFLINE DESKTOP</span>
                </div>
            </footer>
        </div>
    );
}
