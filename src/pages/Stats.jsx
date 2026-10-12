import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NavRail from '../components/NavRail';
import DesktopTitleBar from '../components/DesktopTitleBar';
import ThemeToggle from '../components/ThemeToggle';
import UpdateModal from '../components/UpdateModal';
import { getActivityData, getAllSolved, getLocalDateStr } from '../services/storage';
import { checkForUpdate, CURRENT_VERSION } from '../services/updaterService';
import beginner from '../data/beginner.json';
import neetcode150 from '../data/neetcode150.json';
import blind75 from '../data/blind75.json';
import {
    Flame,
    Trophy,
    Calendar,
    CheckCircle2,
    Activity,
    Layers,
    BarChart3,
    Clock,
    Sparkles,
    ChevronRight,
    ArrowUpCircle
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function Stats() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        activity: {},
        history: [],
        currentStreak: 0,
        maxStreak: 0,
        activeDays: 0,
        totalSolved: 0,
    });
    const [solvedSet, setSolvedSet] = useState(new Set());
    const [hoveredDay, setHoveredDay] = useState(null);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    useEffect(() => {
        getActivityData().then(setStats);
        getAllSolved().then(setSolvedSet);
        checkForUpdate().then(res => {
            if (res && res.hasUpdate) setUpdateInfo(res);
        });
    }, []);

    const { activity = {}, history = [], currentStreak = 0, maxStreak = 0, activeDays = 0, totalSolved = 0 } = stats;

    // Build the 52-week grid (364 days) leading up to current week end (Saturday)
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
            const count = activity[dStr]?.count || 0;
            const isToday = dStr === getLocalDateStr(today);
            const isFuture = curr > today;

            currentWeek.push({
                dateStr: dStr,
                count: isFuture ? 0 : count,
                isToday,
                isFuture,
                dayOfWeek: curr.getDay(),
                month: curr.getMonth(),
                year: curr.getFullYear(),
                dayOfMonth: curr.getDate(),
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

        if (currentWeek.length > 0) weeksArr.push(currentWeek);

        return { weeks: weeksArr, monthLabels: monthsArr };
    }, [activity]);

    const getHeatmapColor = (day) => {
        if (day.isFuture) return 'rgba(255, 255, 255, 0.02)';
        if (day.count === 0) return 'rgba(255, 255, 255, 0.06)';
        if (day.count === 1) return '#0e4429';
        if (day.count === 2) return '#006d32';
        if (day.count >= 3 && day.count < 5) return '#26a641';
        return '#39d353';
    };

    // Calculate difficulty breakdown based on NeetCode 150 + Beginner pool
    const allProblems = useMemo(() => {
        const map = new Map();
        [...beginner, ...neetcode150, ...blind75].forEach(p => map.set(p.id, p));
        return Array.from(map.values());
    }, []);

    const diffStats = useMemo(() => {
        const counts = { Easy: { total: 0, solved: 0 }, Medium: { total: 0, solved: 0 }, Hard: { total: 0, solved: 0 } };
        allProblems.forEach(p => {
            if (counts[p.difficulty]) {
                counts[p.difficulty].total++;
                if (solvedSet.has(p.id) || solvedSet.has(Number(p.id))) {
                    counts[p.difficulty].solved++;
                }
            }
        });
        return counts;
    }, [allProblems, solvedSet]);

    // Calculate top topics breakdown
    const topicStats = useMemo(() => {
        const map = {};
        allProblems.forEach(p => {
            const t = p.topic || 'Algorithms';
            if (!map[t]) map[t] = { total: 0, solved: 0 };
            map[t].total++;
            if (solvedSet.has(p.id) || solvedSet.has(Number(p.id))) {
                map[t].solved++;
            }
        });
        return Object.entries(map)
            .map(([topic, data]) => ({ topic, ...data, pct: Math.round((data.solved / data.total) * 100) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    }, [allProblems, solvedSet]);

    const handleOpenProblem = (problemId) => {
        let track = 'blind75';
        let idx = blind75.findIndex(p => p.id === problemId || p.id === Number(problemId));
        if (idx === -1) {
            idx = neetcode150.findIndex(p => p.id === problemId || p.id === Number(problemId));
            if (idx !== -1) track = 'neetcode150';
        }
        if (idx === -1) {
            idx = beginner.findIndex(p => p.id === problemId || p.id === Number(problemId));
            if (idx !== -1) track = 'beginner';
        }
        if (idx !== -1) {
            localStorage.setItem('offcode_dataset', track);
            localStorage.setItem('offcode_problem_index', String(idx));
            navigate(`/editor?track=${track}&index=${idx}`);
        } else {
            navigate('/editor');
        }
    };

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
            {/* Unified 36px Desktop Titlebar */}
            <DesktopTitleBar subtitle="/ Progress & Analytics" />

            {/* Desktop Body */}
            <div className="desktop-body" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <NavRail
                    onOpenHeatmap={() => navigate('/stats')}
                    onOpenUpdate={() => setShowUpdateModal(true)}
                    updateInfo={updateInfo}
                    streak={currentStreak}
                />

                {/* Main Stats Content */}
                <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ maxWidth: '960px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                        {/* Header Intro */}
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                                Progress & Activity Dashboard
                            </h1>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                                Track your daily problem solving consistency, difficulty distribution, and algorithm topic mastery.
                            </p>
                        </div>

                        {/* Top 4 Stat Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {/* Current Streak */}
                            <div style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.85rem'
                            }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '8px',
                                    background: 'rgba(249, 115, 22, 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Flame size={22} color="#f97316" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f97316' }}>
                                        {currentStreak} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>days</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>CURRENT STREAK</div>
                                </div>
                            </div>

                            {/* Max Streak */}
                            <div style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.85rem'
                            }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '8px',
                                    background: 'rgba(234, 179, 8, 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Trophy size={22} color="#eab308" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                                        {maxStreak} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>days</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>LONGEST STREAK</div>
                                </div>
                            </div>

                            {/* Total Solved */}
                            <div style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.85rem'
                            }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '8px',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <CheckCircle2 size={22} color="#10b981" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                                        {totalSolved} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>solved</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>TOTAL SOLVED</div>
                                </div>
                            </div>

                            {/* Active Days */}
                            <div style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.85rem'
                            }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '8px',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Calendar size={22} color="#3b82f6" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                                        {activeDays} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>days</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>ACTIVE PRACTICE DAYS</div>
                                </div>
                            </div>
                        </div>

                        {/* 52-Week GitHub Style Heatmap Section */}
                        <section style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--bg-panel-border)',
                            borderRadius: '8px',
                            padding: '1.25rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={16} color="var(--accent-primary)" />
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        52-Week Contribution Activity
                                    </h2>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                    {totalSolved} drills completed in last 365 days
                                </div>
                            </div>

                            {/* Heatmap Grid */}
                            <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                <div style={{ minWidth: '700px' }}>
                                    {/* Month labels */}
                                    <div style={{ display: 'flex', marginLeft: '30px', marginBottom: '6px', height: '14px', position: 'relative' }}>
                                        {monthLabels.map((ml, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${ml.weekIndex * 13}px`,
                                                    fontSize: '0.68rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    color: 'var(--text-tertiary)',
                                                }}
                                            >
                                                {ml.month}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Grid container: Day labels + Week columns */}
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {/* Day labels column */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '24px' }}>
                                            {DAY_LABELS.map((lbl, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        height: '10px',
                                                        fontSize: '0.62rem',
                                                        fontFamily: 'var(--font-mono)',
                                                        color: 'var(--text-tertiary)',
                                                        lineHeight: '10px',
                                                        textAlign: 'right',
                                                        paddingRight: '4px',
                                                    }}
                                                >
                                                    {lbl}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Weeks columns */}
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
                                                                background: getHeatmapColor(day),
                                                                border: day.isToday ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.03)',
                                                                cursor: day.isFuture ? 'default' : 'pointer',
                                                                transition: 'transform 0.1s ease',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Legend and Hover preview */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.6rem', borderTop: '1px solid var(--bg-panel-border)' }}>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                            {hoveredDay ? (
                                                <span>
                                                    <strong>{hoveredDay.count}</strong> problem{hoveredDay.count === 1 ? '' : 's'} on {hoveredDay.dateStr}
                                                </span>
                                            ) : (
                                                <span>Hover over squares for drill breakdown</span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                            <span>Less</span>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }} />
                                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0e4429' }} />
                                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#006d32' }} />
                                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#26a641' }} />
                                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#39d353' }} />
                                            <span>More</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Difficulty & Topics Breakdown (2-Column) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                            {/* Difficulty Breakdown */}
                            <section style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <BarChart3 size={16} color="var(--accent-primary)" />
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Difficulty Distribution
                                    </h2>
                                </div>

                                {[
                                    { label: 'Easy', color: '#10b981', ...diffStats.Easy },
                                    { label: 'Medium', color: '#f59e0b', ...diffStats.Medium },
                                    { label: 'Hard', color: '#ef4444', ...diffStats.Hard },
                                ].map((d, i) => {
                                    const pct = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0;
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.color }} />
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</span>
                                                </div>
                                                <div style={{ fontFamily: 'var(--font-mono)' }}>
                                                    <span style={{ color: d.color, fontWeight: 700 }}>{d.solved}</span>
                                                    <span style={{ color: 'var(--text-tertiary)' }}> / {d.total} ({pct}%)</span>
                                                </div>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: d.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </section>

                            {/* Top Topic Mastery */}
                            <section style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Layers size={16} color="var(--accent-primary)" />
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Topic Mastery
                                    </h2>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {topicStats.map((t, idx) => (
                                        <div key={idx}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t.topic}</span>
                                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                                                    {t.solved}/{t.total} ({t.pct}%)
                                                </span>
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${t.pct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Recent Submissions Log */}
                        {history.length > 0 && (
                            <section style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--bg-panel-border)',
                                borderRadius: '8px',
                                padding: '1.25rem',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <Clock size={16} color="var(--accent-primary)" />
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Recent Submissions History
                                    </h2>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {history.slice(0, 10).map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleOpenProblem(item.problemId || item.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '6px',
                                                background: 'rgba(0, 0, 0, 0.1)',
                                                border: '1px solid var(--bg-panel-border)',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-border)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
                                            title="Click to open in Coding Workspace"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <CheckCircle2 size={13} color="#10b981" />
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    #{String(item.problemId || item.id).padStart(3, '0')} {item.title || `Problem ${item.problemId}`}
                                                </span>
                                                {item.language && (
                                                    <span style={{
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '0.68rem',
                                                        padding: '0.05rem 0.35rem',
                                                        borderRadius: '3px',
                                                        background: 'rgba(59, 130, 246, 0.12)',
                                                        color: '#3b82f6',
                                                    }}>
                                                        {item.language}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                                                {item.runtime && <span>{item.runtime}</span>}
                                                <span>{item.date || 'Recent'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

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
                    <Activity size={12} color="var(--accent-primary)" />
                    <span>Analytics</span>
                </div>
                <div>
                    <span>{totalSolved} Solved · {currentStreak} Day Streak</span>
                </div>
            </footer>
        </div>
    );
}
