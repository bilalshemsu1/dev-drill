import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpRight, Check, Flame, Trophy, Calendar, CheckCircle2, ChevronRight, ArrowUpCircle, RefreshCw, Code2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import DesktopTitleBar from '../components/DesktopTitleBar';
import UpdateModal from '../components/UpdateModal';
import NavRail from '../components/NavRail';
import { getActivityData, getAllSolved, getLocalDateStr } from '../services/storage';
import { checkForUpdate, CURRENT_VERSION } from '../services/updaterService';

import beginner from '../data/beginner.json';
import neetcode150 from '../data/neetcode150.json';
import blind75 from '../data/blind75.json';

const TRACKS = {
    beginner: {
        id: 'beginner',
        code: '01',
        title: 'Beginner Essentials',
        count: beginner.length,
        data: beginner,
    },
    neetcode150: {
        id: 'neetcode150',
        code: '02',
        title: 'NeetCode 150',
        count: neetcode150.length,
        data: neetcode150,
    },
    blind75: {
        id: 'blind75',
        code: '03',
        title: 'Blind 75',
        count: blind75.length,
        data: blind75,
    },
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Home() {
    const navigate = useNavigate();

    // Active track & filters
    const [selectedTrack, setSelectedTrack] = useState(() => localStorage.getItem('offcode_dataset') || 'beginner');
    const [searchQuery, setSearchQuery] = useState('');
    const [diffFilter, setDiffFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // User data from IndexedDB/localStorage
    const [activityStats, setActivityStats] = useState({
        activity: {},
        currentStreak: 0,
        maxStreak: 0,
        activeDays: 0,
        totalSolved: 0,
    });
    const [solvedSet, setSolvedSet] = useState(new Set());
    const [hoveredDay, setHoveredDay] = useState(null);

    // Sync theme
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const t = localStorage.getItem('offcode_theme');
        if (t) return t === 'dark';
        return !window.matchMedia('(prefers-color-scheme: light)').matches;
    });

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const t = document.documentElement.getAttribute('data-theme');
            setIsDarkTheme(t !== 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        getActivityData().then(setActivityStats);
        getAllSolved().then(setSolvedSet);
    }, []);

    // Auto-updater state
    const [updateInfo, setUpdateInfo] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [updateStatusToast, setUpdateStatusToast] = useState('');

    useEffect(() => {
        checkForUpdate().then(res => {
            if (res && res.hasUpdate) {
                setUpdateInfo(res);
            }
        });
    }, []);

    const handleManualCheckUpdate = async () => {
        setCheckingUpdate(true);
        setUpdateStatusToast('');
        const res = await checkForUpdate();
        setCheckingUpdate(false);
        if (res && res.hasUpdate) {
            setUpdateInfo(res);
            setShowUpdateModal(true);
        } else {
            setUpdateStatusToast(`DevDrill is up to date (v${CURRENT_VERSION})`);
            setTimeout(() => setUpdateStatusToast(''), 4000);
        }
    };

    // 52-week activity heatmap calculations
    const { weeks, monthLabels } = useMemo(() => {
        const today = new Date();
        const endDate = new Date(today);
        const dayOfWeek = endDate.getDay();
        endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (52 * 7 - 1));

        const weeksArr = [];
        let currentWeek = [];
        const monthsArr = [];
        let lastMonth = -1;

        const curr = new Date(startDate);
        let weekIndex = 0;

        while (curr <= endDate) {
            const dStr = getLocalDateStr(curr);
            const count = activityStats.activity[dStr]?.count || 0;
            const isToday = dStr === getLocalDateStr(today);
            const isFuture = curr > today;

            currentWeek.push({
                dateStr: dStr,
                count: isFuture ? 0 : count,
                isToday,
                isFuture,
                dayOfWeek: curr.getDay(),
            });

            if (curr.getDate() === 1 || (weekIndex === 0 && currentWeek.length === 1)) {
                if (curr.getMonth() !== lastMonth) {
                    monthsArr.push({ month: MONTH_NAMES[curr.getMonth()], weekIndex });
                    lastMonth = curr.getMonth();
                }
            }

            if (currentWeek.length === 7) {
                weeksArr.push(currentWeek);
                currentWeek = [];
                weekIndex++;
            }

            curr.setDate(curr.getDate() + 1);
        }

        if (currentWeek.length > 0) {
            weeksArr.push(currentWeek);
        }

        return { weeks: weeksArr, monthLabels: monthsArr };
    }, [activityStats.activity]);

    // Current problem dataset
    const activeDataset = TRACKS[selectedTrack]?.data || beginner;

    // Track analytics
    const trackAnalytics = useMemo(() => {
        let total = activeDataset.length;
        let solved = 0;
        let easyTotal = 0, easySolved = 0;
        let medTotal = 0, medSolved = 0;
        let hardTotal = 0, hardSolved = 0;

        activeDataset.forEach(p => {
            const isSolved = solvedSet.has(p.id) || solvedSet.has(Number(p.id));
            if (isSolved) solved++;

            if (p.difficulty === 'Easy') {
                easyTotal++;
                if (isSolved) easySolved++;
            } else if (p.difficulty === 'Medium') {
                medTotal++;
                if (isSolved) medSolved++;
            } else if (p.difficulty === 'Hard') {
                hardTotal++;
                if (isSolved) hardSolved++;
            }
        });

        return {
            total,
            solved,
            pct: total > 0 ? Math.round((solved / total) * 100) : 0,
            easyTotal, easySolved,
            medTotal, medSolved,
            hardTotal, hardSolved,
        };
    }, [activeDataset, solvedSet]);

    // Filter problems
    const filteredProblems = useMemo(() => {
        return activeDataset.map((problem, originalIndex) => ({ problem, originalIndex }))
            .filter(({ problem }) => {
                const isSolved = solvedSet.has(problem.id) || solvedSet.has(Number(problem.id));

                if (diffFilter !== 'All' && problem.difficulty !== diffFilter) return false;
                if (statusFilter === 'Solved' && !isSolved) return false;
                if (statusFilter === 'Unsolved' && isSolved) return false;

                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const titleMatch = problem.title.toLowerCase().includes(q);
                    const idMatch = String(problem.id).includes(q);
                    const topicMatch = (problem.topic || '').toLowerCase().includes(q);
                    if (!titleMatch && !idMatch && !topicMatch) return false;
                }

                return true;
            });
    }, [activeDataset, solvedSet, diffFilter, statusFilter, searchQuery]);

    // Navigate to problem in editor
    const handleDrillProblem = (originalIndex) => {
        localStorage.setItem('offcode_onboarded', 'true');
        localStorage.setItem('offcode_dataset', selectedTrack);
        localStorage.setItem('offcode_problem_index', String(originalIndex));
        navigate(`/editor?track=${selectedTrack}&index=${originalIndex}`);
    };

    // Color mapper for heatmap
    const getCellColor = (day) => {
        if (day.isFuture) return isDarkTheme ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)';
        if (day.count === 0) return isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
        if (day.count === 1) return isDarkTheme ? '#0e4429' : '#86efac';
        if (day.count === 2) return isDarkTheme ? '#006d32' : '#4ade80';
        if (day.count >= 3 && day.count < 5) return isDarkTheme ? '#26a641' : '#16a34a';
        return isDarkTheme ? '#39d353' : '#15803d';
    };

    const diffColors = {
        Easy: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
        Medium: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
        Hard: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' },
    };

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-main)', overflow: 'hidden' }}>
            {/* Desktop Titlebar (36px) */}
            <DesktopTitleBar
                subtitle="/ Problem Library"
                actions={
                    <button
                        onClick={() => navigate('/editor')}
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', height: '24px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        <Code2 size={12} color="var(--accent-primary)" />
                        <span>Open Workspace →</span>
                    </button>
                }
            />

            {/* Desktop Body */}
            <div className="desktop-body" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <NavRail
                    onOpenUpdate={() => setShowUpdateModal(true)}
                    updateInfo={updateInfo}
                    streak={activityStats.currentStreak || 0}
                />

                {/* Main Catalog Scrollable Area */}
                <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem 1.5rem 3rem' }}>
                    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
                        {/* Catalog Hero Section */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingBottom: '1.25rem',
                            borderBottom: '1px solid var(--bg-panel-border)',
                            marginBottom: '2rem',
                        }}>
                            <div>
                                <h1 style={{
                                    fontSize: '1.35rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.03em',
                                    textTransform: 'uppercase',
                                    lineHeight: 1.1,
                                    color: 'var(--text-primary)',
                                }}>
                                    Problem Library
                                </h1>
                                <p style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--text-tertiary)',
                                    fontFamily: 'var(--font-mono, monospace)',
                                    letterSpacing: '0.04em',
                                    marginTop: '4px',
                                }}>
                                    Select a problem to drill offline with zero network latency
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button
                                    onClick={() => {
                                        localStorage.setItem('offcode_onboarded', 'true');
                                        navigate('/editor');
                                    }}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.45rem 0.85rem',
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'opacity 0.15s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                    <Code2 size={13} />
                                    <span>Continue Coding</span>
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                        </div>

                {/* Swiss Metric Grid */}
                <section style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    border: '1px solid var(--bg-panel-border)',
                    background: 'var(--bg-panel)',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    overflow: 'hidden',
                }}>
                    {/* Metric 1: Current Streak */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderRight: '1px solid var(--bg-panel-border)',
                    }}>
                        <div style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-tertiary)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}>
                            <Flame size={13} color="#f97316" />
                            Current Streak
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                            {activityStats.currentStreak}
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                {activityStats.currentStreak === 1 ? 'day' : 'days'}
                            </span>
                        </div>
                    </div>

                    {/* Metric 2: Longest Streak */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderRight: '1px solid var(--bg-panel-border)',
                    }}>
                        <div style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-tertiary)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}>
                            <Trophy size={13} color="#eab308" />
                            Best Record
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                            {activityStats.maxStreak}
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                {activityStats.maxStreak === 1 ? 'day' : 'days'}
                            </span>
                        </div>
                    </div>

                    {/* Metric 3: Total Solved */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderRight: '1px solid var(--bg-panel-border)',
                    }}>
                        <div style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-tertiary)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}>
                            <CheckCircle2 size={13} color="#10b981" />
                            Total Solved
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                            {activityStats.totalSolved}
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                problems
                            </span>
                        </div>
                    </div>

                    {/* Metric 4: Active Days */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                    }}>
                        <div style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-tertiary)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}>
                            <Calendar size={13} color="#3b82f6" />
                            Active Days
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                            {activityStats.activeDays}
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                days
                            </span>
                        </div>
                    </div>
                </section>

                {/* Swiss Activity Heatmap */}
                <section style={{
                    border: '1px solid var(--bg-panel-border)',
                    background: 'var(--bg-panel)',
                    borderRadius: '8px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '2.5rem',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.9rem',
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'var(--text-secondary)',
                        }}>
                            52-Week Contribution Matrix
                        </div>
                        {hoveredDay ? (
                            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                                {hoveredDay.dateStr} • {hoveredDay.count} {hoveredDay.count === 1 ? 'solve' : 'solves'}
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                All activity evaluated offline
                            </div>
                        )}
                    </div>

                    {/* Calendar grid container */}
                    <div style={{ overflowX: 'auto', paddingBottom: '0.3rem' }}>
                        <div style={{ display: 'inline-block', minWidth: '700px' }}>
                            {/* Months header */}
                            <div style={{
                                display: 'flex',
                                height: '16px',
                                position: 'relative',
                                marginBottom: '4px',
                            }}>
                                {monthLabels.map((m, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            position: 'absolute',
                                            left: `${m.weekIndex * 13}px`,
                                            fontSize: '0.68rem',
                                            color: 'var(--text-tertiary)',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {m.month}
                                    </div>
                                ))}
                            </div>

                            {/* 52 Columns */}
                            <div style={{ display: 'flex', gap: '3px' }}>
                                {weeks.map((week, wIdx) => (
                                    <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        {week.map((day, dIdx) => (
                                            <div
                                                key={dIdx}
                                                onMouseEnter={() => setHoveredDay(day)}
                                                onMouseLeave={() => setHoveredDay(null)}
                                                style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '2px',
                                                    background: getCellColor(day),
                                                    outline: day.isToday ? '1px solid #10b981' : 'none',
                                                    cursor: day.isFuture ? 'default' : 'pointer',
                                                    transition: 'transform 0.1s ease',
                                                }}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '4px',
                                marginTop: '0.75rem',
                                fontSize: '0.7rem',
                                color: 'var(--text-tertiary)',
                            }}>
                                <span>Less</span>
                                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }} />
                                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: isDarkTheme ? '#0e4429' : '#86efac' }} />
                                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: isDarkTheme ? '#006d32' : '#4ade80' }} />
                                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: isDarkTheme ? '#26a641' : '#16a34a' }} />
                                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: isDarkTheme ? '#39d353' : '#15803d' }} />
                                <span>More</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Track Switcher & Analysis Bar */}
                <section style={{ marginBottom: '1.25rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        marginBottom: '1rem',
                    }}>
                        {/* Track Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '0.35rem',
                            background: 'var(--bg-panel)',
                            padding: '3px',
                            borderRadius: '8px',
                            border: '1px solid var(--bg-panel-border)',
                        }}>
                            {Object.values(TRACKS).map(track => {
                                const isActive = selectedTrack === track.id;
                                return (
                                    <button
                                        key={track.id}
                                        onClick={() => {
                                            setSelectedTrack(track.id);
                                            localStorage.setItem('offcode_dataset', track.id);
                                        }}
                                        style={{
                                            padding: '0.45rem 0.95rem',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: isActive ? 'var(--text-primary)' : 'transparent',
                                            color: isActive ? 'var(--bg-main)' : 'var(--text-secondary)',
                                            fontSize: '0.78rem',
                                            fontWeight: isActive ? 700 : 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <span style={{ opacity: 0.6, marginRight: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                                            {track.code}
                                        </span>
                                        {track.title}
                                        <span style={{
                                            marginLeft: '6px',
                                            fontSize: '0.72rem',
                                            opacity: isActive ? 0.8 : 0.5,
                                        }}>
                                            ({track.count})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Track Analysis Summary */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            fontSize: '0.78rem',
                        }}>
                            <div style={{ color: 'var(--text-secondary)' }}>
                                Track Progress: <strong style={{ color: 'var(--text-primary)' }}>{trackAnalytics.solved}/{trackAnalytics.total}</strong> ({trackAnalytics.pct}%)
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ color: '#10b981', fontWeight: 600 }}>E: {trackAnalytics.easySolved}/{trackAnalytics.easyTotal}</span>
                                <span style={{ color: '#f59e0b', fontWeight: 600 }}>M: {trackAnalytics.medSolved}/{trackAnalytics.medTotal}</span>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>H: {trackAnalytics.hardSolved}/{trackAnalytics.hardTotal}</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                    }}>
                        {/* Search Input */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flex: 1,
                            minWidth: '240px',
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--bg-panel-border)',
                            borderRadius: '6px',
                            padding: '0.45rem 0.75rem',
                        }}>
                            <Search size={14} color="var(--text-tertiary)" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Filter problems by title, number, or category..."
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.82rem',
                                    width: '100%',
                                    fontFamily: 'var(--font-sans)',
                                }}
                            />
                        </div>

                        {/* Difficulty Filter */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDiffFilter(d)}
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: '6px',
                                        border: '1px solid var(--bg-panel-border)',
                                        background: diffFilter === d ? 'var(--bg-panel-border)' : 'transparent',
                                        color: diffFilter === d ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        fontSize: '0.76rem',
                                        fontWeight: diffFilter === d ? 700 : 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {['All', 'Solved', 'Unsolved'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: '6px',
                                        border: '1px solid var(--bg-panel-border)',
                                        background: statusFilter === s ? 'var(--bg-panel-border)' : 'transparent',
                                        color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        fontSize: '0.76rem',
                                        fontWeight: statusFilter === s ? 700 : 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Swiss Problem Table */}
                <section style={{
                    border: '1px solid var(--bg-panel-border)',
                    background: 'var(--bg-panel)',
                    borderRadius: '8px',
                    overflowX: 'auto',
                }}>
                    <div style={{ minWidth: '680px' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '70px 1fr 180px 110px 100px 90px',
                            padding: '0.65rem 1.25rem',
                            borderBottom: '1px solid var(--bg-panel-border)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'var(--text-tertiary)',
                            fontFamily: 'var(--font-mono, monospace)',
                        }}>
                        <div>#</div>
                        <div>Problem</div>
                        <div>Topic</div>
                        <div>Difficulty</div>
                        <div>Status</div>
                        <div style={{ textAlign: 'right' }}>Drill</div>
                    </div>

                    {filteredProblems.length === 0 ? (
                        <div style={{
                            padding: '3rem 1rem',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                        }}>
                            No problems match your current filter.
                        </div>
                    ) : (
                        <div>
                            {filteredProblems.map(({ problem, originalIndex }) => {
                                const isSolved = solvedSet.has(problem.id) || solvedSet.has(Number(problem.id));
                                const diffStyle = diffColors[problem.difficulty] || diffColors.Easy;

                                return (
                                    <div
                                        key={problem.id}
                                        onClick={() => handleDrillProblem(originalIndex)}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '70px 1fr 180px 110px 100px 90px',
                                            padding: '0.75rem 1.25rem',
                                            alignItems: 'center',
                                            borderBottom: '1px solid var(--bg-panel-border)',
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            transition: 'background 0.12s ease',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-border)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {/* Problem ID */}
                                        <div style={{
                                            fontFamily: 'var(--font-mono, monospace)',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-tertiary)',
                                        }}>
                                            #{String(problem.id).padStart(3, '0')}
                                        </div>

                                        {/* Problem Title */}
                                        <div style={{
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            paddingRight: '1rem',
                                        }}>
                                            {problem.title}
                                        </div>

                                        {/* Topic */}
                                        <div style={{
                                            fontSize: '0.74rem',
                                            color: 'var(--text-secondary)',
                                            fontFamily: 'var(--font-sans)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {problem.topic || 'Algorithms'}
                                        </div>

                                        {/* Difficulty */}
                                        <div>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                background: diffStyle.bg,
                                                color: diffStyle.text,
                                                border: `1px solid ${diffStyle.border}`,
                                            }}>
                                                <span style={{
                                                    width: '5px',
                                                    height: '5px',
                                                    borderRadius: '50%',
                                                    background: diffStyle.text,
                                                }} />
                                                {problem.difficulty}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            {isSolved ? (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 600,
                                                    color: '#10b981',
                                                }}>
                                                    <Check size={13} /> Solved
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                    —
                                                </span>
                                            )}
                                        </div>

                                        {/* Action */}
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '2px',
                                                fontSize: '0.76rem',
                                                fontWeight: 600,
                                                color: 'var(--accent-primary)',
                                            }}>
                                                Solve <ChevronRight size={13} />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    </div>
                </section>

                {/* Minimal Swiss Footer with Updater */}
                <footer style={{
                    marginTop: '3.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--bg-panel-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                }}>
                    <div>
                        DevDrill v{CURRENT_VERSION} • Minimalist Algorithmic Engine
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {updateStatusToast && (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>{updateStatusToast}</span>
                        )}
                        <button
                            onClick={handleManualCheckUpdate}
                            disabled={checkingUpdate}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '0.74rem',
                                fontFamily: 'var(--font-mono)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: 0,
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                            <RefreshCw size={12} style={{ animation: checkingUpdate ? 'spin 1s linear infinite' : 'none' }} />
                            <span>{checkingUpdate ? 'Checking...' : 'Check for Updates'}</span>
                        </button>
                    </div>
                </footer>

                    </div>
                </main>
            </div>

            {/* Desktop Status Bar */}
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
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>[{TRACKS[selectedTrack]?.code}]</span>
                    <span>{TRACKS[selectedTrack]?.title} ({activeDataset.length} problems)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>{trackAnalytics.solved}/{activeDataset.length} Solved</span>
                    <span style={{ opacity: 0.3 }}>│</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>● OFFLINE</span>
                </div>
            </footer>

            {showUpdateModal && updateInfo && (
                <UpdateModal updateInfo={updateInfo} onClose={() => setShowUpdateModal(false)} />
            )}
        </div>
    );
}
