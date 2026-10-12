import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProblemPanel from '../components/ProblemPanel';
import EditorPanel from '../components/EditorPanel';
import ConsolePanel from '../components/ConsolePanel';
import HeatmapModal from '../components/HeatmapModal';
import UpdateModal from '../components/UpdateModal';
import Resizer from '../components/Resizer';
import ThemeToggle from '../components/ThemeToggle';
import NavRail from '../components/NavRail';
import StatusBar from '../components/StatusBar';
import { executeCode } from '../services/executionService';
import { saveCode, getCode, markSolved, getAllSolved, getActivityData } from '../services/storage';
import { checkForUpdate } from '../services/updaterService';
import ProblemSelector from '../components/ProblemSelector';
import beginner from '../data/beginner.json';
import neetcode150 from '../data/neetcode150.json';
import blind75 from '../data/blind75.json';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WindowControls from '../components/WindowControls';
import { Flame, ChevronLeft, ChevronRight, ChevronDown, Check, FileText, Code2, Terminal, ArrowUpCircle } from 'lucide-react';

const DATASETS = {
    'beginner': { name: 'Beginner Essentials', count: beginner.length, data: beginner },
    'neetcode150': { name: 'NeetCode 150', count: neetcode150.length, data: neetcode150 },
    'blind75': { name: 'Blind 75', count: blind75.length, data: blind75 },
};

const TRACK_OPTIONS = [
    { key: 'beginner', code: '01', label: 'Beginner Essentials', count: beginner.length },
    { key: 'neetcode150', code: '02', label: 'NeetCode 150', count: neetcode150.length },
    { key: 'blind75', code: '03', label: 'Blind 75', count: blind75.length },
];

function Editor() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const queryTrack = searchParams.get('track');
    const queryIndex = searchParams.get('index');

    const [datasetKey, setDatasetKey] = useState(() => {
        if (queryTrack && DATASETS[queryTrack]) return queryTrack;
        return localStorage.getItem('offcode_dataset') || 'beginner';
    });
    const problems = DATASETS[datasetKey]?.data || beginner;

    const [currentProblemIndex, setCurrentProblemIndex] = useState(() => {
        if (queryIndex !== null && !isNaN(parseInt(queryIndex, 10))) {
            const num = parseInt(queryIndex, 10);
            if (num >= 0 && num < problems.length) return num;
        }
        const saved = localStorage.getItem('offcode_problem_index');
        const num = saved !== null ? parseInt(saved, 10) : 0;
        return !isNaN(num) && num >= 0 && num < problems.length ? num : 0;
    });

    // Keep state in sync if URL query parameters change
    useEffect(() => {
        if (queryTrack && DATASETS[queryTrack] && queryTrack !== datasetKey) {
            setDatasetKey(queryTrack);
            localStorage.setItem('offcode_dataset', queryTrack);
        }
        if (queryIndex !== null) {
            const num = parseInt(queryIndex, 10);
            if (!isNaN(num) && num >= 0 && num < problems.length && num !== currentProblemIndex) {
                setCurrentProblemIndex(num);
                localStorage.setItem('offcode_problem_index', String(num));
            }
        }
    }, [queryTrack, queryIndex, problems.length]);
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('');
    const [cursorPos, setCursorPos] = useState({ lineNumber: 1, column: 1 });
    const [consoleOutput, setConsoleOutput] = useState('');
    const [executionDetails, setExecutionDetails] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [activityStats, setActivityStats] = useState(null);
    const [solvedSet, setSolvedSet] = useState(new Set());

    const [appTheme, setAppTheme] = useState(() => localStorage.getItem('offcode_theme') || 'dark');
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
    const [mobileTab, setMobileTab] = useState('problem'); // 'problem' | 'code' | 'console'

    const [trackMenuOpen, setTrackMenuOpen] = useState(false);
    const trackMenuRef = useRef(null);

    // Close track dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (trackMenuRef.current && !trackMenuRef.current.contains(e.target)) {
                setTrackMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const solvedCountInTrack = problems.filter(p => solvedSet.has(p.id) || solvedSet.has(Number(p.id))).length;

    // In-App Auto-Updater
    const [updateInfo, setUpdateInfo] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    useEffect(() => {
        checkForUpdate().then(res => {
            if (res && res.hasUpdate) {
                setUpdateInfo(res);
            }
        });
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Keep appTheme in sync when ThemeToggle changes the DOM
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const t = document.documentElement.getAttribute('data-theme');
            setAppTheme(t === 'light' ? 'light' : 'dark');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // Pane sizes: leftPct = left pane width %, editorPct = editor height % within right pane
    const [leftPct, setLeftPct] = useState(40);
    const [editorPct, setEditorPct] = useState(65);

    const handleHorizontalResize = useCallback((delta) => {
        setLeftPct(prev => {
            const workspaceWidth = document.querySelector('.main-workspace')?.offsetWidth || window.innerWidth;
            const newPct = prev + (delta / workspaceWidth) * 100;
            return Math.min(Math.max(newPct, 20), 70);
        });
    }, []);

    const handleVerticalResize = useCallback((delta) => {
        setEditorPct(prev => {
            const rightPane = document.querySelector('.right-pane')?.offsetHeight || window.innerHeight;
            const newPct = prev + (delta / rightPane) * 100;
            return Math.min(Math.max(newPct, 20), 80);
        });
    }, []);

    const refreshActivity = useCallback(() => {
        getActivityData().then(setActivityStats);
    }, []);

    // Load solved set and activity stats from IndexedDB/localStorage on mount
    useEffect(() => {
        getAllSolved().then(setSolvedSet);
        refreshActivity();
    }, [refreshActivity]);

    const problem = problems[currentProblemIndex] || problems[0] || {};

    const handleProblemSelect = (idx) => {
        setCurrentProblemIndex(idx);
        localStorage.setItem('offcode_problem_index', String(idx));
        setSearchParams({ track: datasetKey, index: String(idx) });
    };

    const handleDatasetChange = (key) => {
        setDatasetKey(key);
        localStorage.setItem('offcode_dataset', key);
        setCurrentProblemIndex(0);
        localStorage.setItem('offcode_problem_index', '0');
        setSearchParams({ track: key, index: '0' });
    };

    const handleResetCode = () => {
        if (problem?.starterCode) {
            setCode(problem.starterCode[language] || '');
        }
    };

    // Load code from IndexedDB or fallback to starter code
    useEffect(() => {
        if (!problem?.id) return;
        async function loadInitialCode() {
            const savedCode = await getCode(problem.id, language);
            if (savedCode) {
                setCode(savedCode);
            } else {
                setCode(problem.starterCode?.[language] || '');
            }
        }
        loadInitialCode();
    }, [problem?.id, language]);

    // Save code dynamically as it changes
    useEffect(() => {
        if (code && problem?.id) {
            saveCode(problem.id, language, code);
        }
    }, [code, problem?.id, language]);

    const handleRunCode = async () => {
        setIsRunning(true);
        setConsoleOutput('Running...\n');
        if (isMobile) {
            setMobileTab('console');
        }

        try {
            // Run the first min(3, testcases.length) tests to give basic feedback on Run
            const allTests = problem.testCases[language] || [];
            const exampleTests = allTests.slice(0, 3);
            const res = await executeCode(language, code, exampleTests);

            setExecutionDetails(res);
            let out = `Status: ${res.status}\nRuntime: ${res.runtime}\n`;
            if (res.error) out += `\nError:\n${res.error}`;
            if (res.logs) out += `\nOutput:\n${res.logs}\n`;

            if (res.results && res.results.length > 0) {
                const passed = res.results.filter(r => r.passed).length;
                out += `\nPassed ${passed} / ${res.results.length} example testcases.`;

                // Show first failing test error
                const firstFailed = res.results.find(r => !r.passed);
                if (firstFailed) {
                    out += `\n\nTestcase ${firstFailed.testId + 1} Failed:\n${firstFailed.error}`;
                }
            }

            setConsoleOutput(out);
        } catch (e) {
            setConsoleOutput(`Error: ${e.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitCode = async () => {
        setIsRunning(true);
        setConsoleOutput('Running all tests...\n');
        setExecutionDetails(null);
        if (isMobile) {
            setMobileTab('console');
        }

        try {
            // Pass the actual testcases from the static data
            const tests = problem.testCases[language] || [];
            const res = await executeCode(language, code, tests);
            setExecutionDetails(res);

            let out = `Status: ${res.status}\nRuntime: ${res.runtime}\n`;
            if (res.error) out += `\nError:\n${res.error}`;
            if (res.logs) out += `\nStdout:\n${res.logs}\n`;

            if (res.results && res.results.length > 0) {
                const passed = res.results.filter(r => r.passed).length;
                out += `\nPassed ${passed} / ${res.results.length} testcases.`;

                // Mark solved ONLY if status is Accepted and all tests passed
                if (res.status === 'Accepted' && passed === res.results.length) {
                    await markSolved(problem.id, problem.title, language);
                    setSolvedSet(prev => new Set([...prev, problem.id]));
                    refreshActivity();
                }

                // Show first failing test error
                const firstFailed = res.results.find(r => !r.passed);
                if (firstFailed) {
                    out += `\n\nTestcase ${firstFailed.testId + 1} Failed:\n${firstFailed.error}`;
                }
            }

            setConsoleOutput(out);
        } catch (e) {
            setConsoleOutput(`Error: ${e.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    // Keyboard Shortcuts: Cmd/Ctrl + Enter (Run), Cmd/Ctrl + Shift + Enter (Submit)
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isMod = e.metaKey || e.ctrlKey;
            const isShift = e.shiftKey;
            const isEnter = e.key === 'Enter';

            if (isMod && isEnter) {
                e.preventDefault();
                if (isRunning) return;

                if (isShift) {
                    handleSubmitCode();
                } else {
                    handleRunCode();
                }
            } else if (isMod && e.key === '1') {
                e.preventDefault();
                navigate('/editor');
            } else if (isMod && e.key === '2') {
                e.preventDefault();
                navigate('/');
            } else if (isMod && e.key === '3') {
                e.preventDefault();
                navigate('/stats');
            } else if (isMod && e.key === ',') {
                e.preventDefault();
                navigate('/settings');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRunning, code, language, currentProblemIndex, navigate]);

    return (
        <div className="app-container">
            {/* Slim Desktop Titlebar (36px) */}
            <header className="app-header" style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.85rem',
                height: '36px',
                minHeight: '36px',
                gap: '0.75rem',
                background: 'var(--bg-main)',
                borderBottom: '1px solid var(--bg-panel-border)',
                borderRadius: 0,
                WebkitAppRegion: 'drag',
                userSelect: 'none',
            }}>
                {/* Left: Brand Identity + Flat Track Picker */}
                <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0, WebkitAppRegion: 'no-drag' }}>
                    {/* Brand */}
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => navigate('/')}
                        title="Back to Problem Catalog"
                    >
                        <img
                            src="/logo.svg"
                            alt="DevDrill Logo"
                            style={{
                                width: '20px',
                                height: '20px',
                            }}
                        />
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                            DevDrill
                        </span>
                    </div>

                    {/* Hairline Divider */}
                    <div className="header-divider" style={{ width: '1px', height: '14px', background: 'var(--bg-panel-border)' }} />

                    {/* Flat Track Selector Dropdown */}
                    <div ref={trackMenuRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setTrackMenuOpen(o => !o)}
                            title="Select Practice Track"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0 0.5rem',
                                height: '26px',
                                background: trackMenuOpen ? 'var(--bg-panel)' : 'transparent',
                                border: `1px solid ${trackMenuOpen ? 'var(--accent-primary)' : 'transparent'}`,
                                borderRadius: '5px',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => {
                                if (!trackMenuOpen) {
                                    e.currentTarget.style.background = 'var(--bg-panel)';
                                    e.currentTarget.style.borderColor = 'var(--bg-panel-border)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!trackMenuOpen) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }
                            }}
                        >
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.68rem',
                                padding: '0.05rem 0.3rem',
                                borderRadius: '3px',
                                background: 'rgba(59, 130, 246, 0.14)',
                                color: '#3b82f6',
                                fontWeight: 700,
                            }}>
                                {TRACK_OPTIONS.find(t => t.key === datasetKey)?.code || '01'}
                            </span>
                            <span style={{ letterSpacing: '-0.01em' }}>
                                {TRACK_OPTIONS.find(t => t.key === datasetKey)?.label || 'Beginner Essentials'}
                            </span>
                            <ChevronDown
                                size={11}
                                style={{
                                    opacity: 0.5,
                                    transform: trackMenuOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.15s',
                                }}
                            />
                        </button>

                        {trackMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '30px',
                                left: 0,
                                zIndex: 9999,
                                minWidth: '220px',
                                background: 'var(--bg-main)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
                                padding: '0.3rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                            }}>
                                {TRACK_OPTIONS.map(opt => {
                                    const isCurrent = opt.key === datasetKey;
                                    return (
                                        <button
                                            key={opt.key}
                                            onClick={() => {
                                                handleDatasetChange(opt.key);
                                                setTrackMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '0.75rem',
                                                padding: '0.45rem 0.65rem',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: isCurrent ? 'var(--bg-panel)' : 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--bg-panel)'; }}
                                            onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    color: isCurrent ? '#3b82f6' : 'var(--text-tertiary)',
                                                }}>
                                                    {opt.code}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 500 }}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.68rem',
                                                color: 'var(--text-tertiary)',
                                            }}>
                                                {opt.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: Previous + Flat Breadcrumb Problem Selector + Next */}
                <div className="header-center" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, maxWidth: '460px', justifyContent: 'center', WebkitAppRegion: 'no-drag' }}>
                    <button
                        disabled={currentProblemIndex <= 0}
                        onClick={() => handleProblemSelect(currentProblemIndex - 1)}
                        style={{
                            width: '26px',
                            height: '26px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: currentProblemIndex <= 0 ? 0.25 : 0.8,
                            borderRadius: '5px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: currentProblemIndex <= 0 ? 'default' : 'pointer',
                            padding: 0,
                            flexShrink: 0,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (currentProblemIndex > 0) e.currentTarget.style.background = 'var(--bg-panel)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        title="Previous Problem [Alt + Left]"
                    >
                        <ChevronLeft size={15} />
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <ProblemSelector
                            problems={problems}
                            currentIndex={currentProblemIndex}
                            solvedSet={solvedSet}
                            onSelect={handleProblemSelect}
                        />
                    </div>

                    <button
                        disabled={currentProblemIndex >= problems.length - 1}
                        onClick={() => handleProblemSelect(currentProblemIndex + 1)}
                        style={{
                            width: '26px',
                            height: '26px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: currentProblemIndex >= problems.length - 1 ? 0.25 : 0.8,
                            borderRadius: '5px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: currentProblemIndex >= problems.length - 1 ? 'default' : 'pointer',
                            padding: 0,
                            flexShrink: 0,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (currentProblemIndex < problems.length - 1) e.currentTarget.style.background = 'var(--bg-panel)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        title="Next Problem [Alt + Right]"
                    >
                        <ChevronRight size={15} />
                    </button>
                </div>

                {/* Right: Streak + Theme Toggle + In-App Update */}
                <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0, WebkitAppRegion: 'no-drag' }}>
                    {/* In-App Update Pill (if new release available) */}
                    {updateInfo?.hasUpdate && (
                        <button
                            onClick={() => setShowUpdateModal(true)}
                            title={`Update Available: v${updateInfo.latestVersion}. Click to install.`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0 0.5rem',
                                height: '24px',
                                borderRadius: '5px',
                                background: 'rgba(59, 130, 246, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                color: '#3b82f6',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <ArrowUpCircle size={12} color="#3b82f6" />
                            <span>v{updateInfo.latestVersion}</span>
                        </button>
                    )}

                    {/* Streak Button */}
                    <button
                        onClick={() => navigate('/stats')}
                        title="View Activity & 52-Week Heatmap [/stats]"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            background: (activityStats?.currentStreak || 0) > 0 ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                            border: `1px solid ${(activityStats?.currentStreak || 0) > 0 ? 'rgba(249, 115, 22, 0.35)' : 'transparent'}`,
                            color: (activityStats?.currentStreak || 0) > 0 ? '#f97316' : 'var(--text-secondary)',
                            borderRadius: '5px',
                            padding: '0 0.5rem',
                            height: '24px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <Flame size={12} color="#f97316" />
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{activityStats?.currentStreak || 0}d</span>
                    </button>

                    <div className="header-divider" style={{ width: '1px', height: '14px', background: 'var(--bg-panel-border)' }} />

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    <div className="header-divider" style={{ width: '1px', height: '14px', background: 'var(--bg-panel-border)', margin: '0 0.15rem' }} />

                    {/* Native Desktop Window Controls */}
                    <WindowControls />
                </div>
            </header>

            {showHeatmap && (
                <HeatmapModal stats={activityStats} onDismiss={() => setShowHeatmap(false)} />
            )}

            {showUpdateModal && updateInfo && (
                <UpdateModal updateInfo={updateInfo} onClose={() => setShowUpdateModal(false)} />
            )}

            {/* Mobile Tab Switcher */}
            {isMobile && (
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-panel)',
                    borderBottom: '1px solid var(--bg-panel-border)',
                    padding: '3px',
                    gap: '4px',
                    flexShrink: 0,
                }}>
                    <button
                        onClick={() => setMobileTab('problem')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '6px 0',
                            border: 'none',
                            borderRadius: '4px',
                            background: mobileTab === 'problem' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            color: mobileTab === 'problem' ? '#60a5fa' : 'var(--text-secondary)',
                            fontWeight: mobileTab === 'problem' ? 600 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <FileText size={13} />
                        <span>Problem</span>
                    </button>
                    <button
                        onClick={() => setMobileTab('code')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '6px 0',
                            border: 'none',
                            borderRadius: '4px',
                            background: mobileTab === 'code' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            color: mobileTab === 'code' ? '#60a5fa' : 'var(--text-secondary)',
                            fontWeight: mobileTab === 'code' ? 600 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <Code2 size={13} />
                        <span>Code</span>
                    </button>
                    <button
                        onClick={() => setMobileTab('console')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '6px 0',
                            border: 'none',
                            borderRadius: '4px',
                            background: mobileTab === 'console' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            color: mobileTab === 'console' ? '#60a5fa' : 'var(--text-secondary)',
                            fontWeight: mobileTab === 'console' ? 600 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <Terminal size={13} />
                        <span>Console</span>
                    </button>
                </div>
            )}

            {/* Main Desktop Body (NavRail + Workspace) */}
            <div className="desktop-body" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {!isMobile && (
                    <NavRail
                        onOpenHeatmap={() => setShowHeatmap(true)}
                        onOpenUpdate={() => setShowUpdateModal(true)}
                        updateInfo={updateInfo}
                        streak={activityStats?.currentStreak || 0}
                    />
                )}

                <main className="main-workspace">
                    {isMobile ? (
                        <div style={{ flex: 1, minHeight: 0, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                            {mobileTab === 'problem' && (
                                <div style={{ flex: 1, minHeight: 0, height: '100%' }}>
                                    <ProblemPanel problem={problem} language={language} />
                                </div>
                            )}
                            {mobileTab === 'code' && (
                                <div style={{ flex: 1, minHeight: 0, height: '100%' }}>
                                    <EditorPanel
                                        language={language}
                                        setLanguage={setLanguage}
                                        code={code}
                                        setCode={setCode}
                                        monacoTheme={appTheme === 'light' ? 'vs' : 'vs-dark'}
                                        onRun={handleRunCode}
                                        onSubmit={handleSubmitCode}
                                        onReset={handleResetCode}
                                        isRunning={isRunning}
                                        onCursorChange={setCursorPos}
                                    />
                                </div>
                            )}
                            {mobileTab === 'console' && (
                                <div style={{ flex: 1, minHeight: 0, height: '100%' }}>
                                    <ConsolePanel output={consoleOutput} problemId={problem?.id} executionDetails={executionDetails} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="left-pane" style={{ flex: 'none', width: `${leftPct}%` }}>
                                <ProblemPanel problem={problem} language={language} />
                            </div>
                            <Resizer direction="horizontal" onResize={handleHorizontalResize} />
                            <div className="right-pane" style={{ flex: 1 }}>
                                <div className="editor-container" style={{ flex: 'none', height: `${editorPct}%` }}>
                                    <EditorPanel
                                        language={language}
                                        setLanguage={setLanguage}
                                        code={code}
                                        setCode={setCode}
                                        monacoTheme={appTheme === 'light' ? 'vs' : 'vs-dark'}
                                        onRun={handleRunCode}
                                        onSubmit={handleSubmitCode}
                                        onReset={handleResetCode}
                                        isRunning={isRunning}
                                        onCursorChange={setCursorPos}
                                    />
                                </div>
                                <Resizer direction="vertical" onResize={handleVerticalResize} />
                                <div className="console-container" style={{ flex: 1 }}>
                                    <ConsolePanel output={consoleOutput} problemId={problem?.id} executionDetails={executionDetails} />
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Desktop Status Bar (24px) */}
            {!isMobile && (
                <StatusBar
                    problem={problem}
                    trackCode={TRACK_OPTIONS.find(t => t.key === datasetKey)?.code || '01'}
                    trackName={TRACK_OPTIONS.find(t => t.key === datasetKey)?.label || 'Beginner Essentials'}
                    solvedCount={solvedCountInTrack}
                    totalCount={problems.length}
                    language={language}
                    cursorPos={cursorPos}
                    streak={activityStats?.currentStreak || 0}
                    updateInfo={updateInfo}
                    onOpenHeatmap={() => navigate('/stats')}
                    onOpenUpdate={() => setShowUpdateModal(true)}
                />
            )}
        </div>
    );
}

export default Editor;
