import React, { useState, useMemo } from 'react';
import { Flame, Trophy, Calendar, CheckCircle2, X, Activity, Sparkles } from 'lucide-react';
import { getLocalDateStr } from '../services/storage';

const overlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
};

const modal = {
  background: '#0B0E14',
  border: '1px solid rgba(59, 130, 246, 0.25)',
  borderRadius: '20px',
  padding: '1.75rem',
  maxWidth: '820px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
  color: 'white',
  fontFamily: 'var(--font-sans, sans-serif)',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function HeatmapModal({ stats, onDismiss }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const { activity = {}, history = [], currentStreak = 0, maxStreak = 0, activeDays = 0, totalSolved = 0 } = stats || {};

  // Build the 52-week grid (364 days) leading up to current week end (Saturday)
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    // End on upcoming/current Saturday
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay(); // 0 is Sunday, 6 is Saturday
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

    // 52 weeks back
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

      const dayObj = {
        dateStr: dStr,
        count: isFuture ? 0 : count,
        isToday,
        isFuture,
        dayOfWeek: curr.getDay(),
        month: curr.getMonth(),
        year: curr.getFullYear(),
        dayOfMonth: curr.getDate(),
      };

      currentWeek.push(dayObj);

      // Check month label at start of month
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
  }, [activity]);

  const getColor = (day) => {
    if (day.isFuture) return 'rgba(255, 255, 255, 0.02)';
    if (day.count === 0) return 'rgba(255, 255, 255, 0.05)';
    if (day.count === 1) return '#0e4429';
    if (day.count === 2) return '#006d32';
    if (day.count >= 3 && day.count < 5) return '#26a641';
    return '#39d353';
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <div style={modal}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Flame size={20} color="#f97316" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                Activity & Daily Streak
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                Track your consistent coding journey offline
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          {/* Current Streak */}
          <div style={{
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f97316', fontSize: '0.78rem', fontWeight: 600 }}>
              <Flame size={14} /> Current Streak
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', color: 'white' }}>
              {currentStreak} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{currentStreak === 1 ? 'day' : 'days'}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.2rem' }}>
              {currentStreak > 0 ? 'Active streak! Keep going' : 'Solve 1 problem to start!'}
            </div>
          </div>

          {/* Longest Streak */}
          <div style={{
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#eab308', fontSize: '0.78rem', fontWeight: 600 }}>
              <Trophy size={14} /> Longest Streak
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', color: 'white' }}>
              {maxStreak} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{maxStreak === 1 ? 'day' : 'days'}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.2rem' }}>
              Personal best record
            </div>
          </div>

          {/* Active Days */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3b82f6', fontSize: '0.78rem', fontWeight: 600 }}>
              <Calendar size={14} /> Active Days
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', color: 'white' }}>
              {activeDays} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>days</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.2rem' }}>
              Days with solutions
            </div>
          </div>

          {/* Total Solved */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Total Solved
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', color: 'white' }}>
              {totalSolved} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>problems</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.2rem' }}>
              Offline submissions passed
            </div>
          </div>
        </div>

        {/* Heatmap Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
              Past 12 Months Heatmap
            </span>
            {hoveredDay && (
              <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 600 }}>
                {hoveredDay.dateStr}: {hoveredDay.count} {hoveredDay.count === 1 ? 'problem' : 'problems'} solved
              </span>
            )}
          </div>

          {/* Scrollable calendar view */}
          <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'inline-block', minWidth: '700px' }}>
              {/* Month Header */}
              <div style={{ display: 'flex', marginLeft: '32px', marginBottom: '6px', height: '14px', position: 'relative' }}>
                {monthLabels.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${m.weekIndex * 13}px`,
                      fontSize: '0.68rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontWeight: 500,
                    }}
                  >
                    {m.month}
                  </div>
                ))}
              </div>

              {/* Grid with Day Labels */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {/* Day labels (Sun-Sat) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '28px', marginRight: '4px' }}>
                  {DAY_LABELS.map((lbl, idx) => (
                    <div
                      key={idx}
                      style={{
                        height: '10px',
                        fontSize: '0.62rem',
                        lineHeight: '10px',
                        color: 'rgba(255, 255, 255, 0.35)',
                        textAlign: 'right',
                        paddingRight: '4px',
                      }}
                    >
                      {lbl}
                    </div>
                  ))}
                </div>

                {/* Weeks Columns */}
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {week.map((day, dIdx) => (
                      <div
                        key={dIdx}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={`${day.dateStr}: ${day.count} solved`}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2.5px',
                          background: getColor(day),
                          border: day.isToday ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease',
                          transform: hoveredDay?.dateStr === day.dateStr ? 'scale(1.4)' : 'scale(1)',
                          zIndex: hoveredDay?.dateStr === day.dateStr ? 10 : 1,
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
                gap: '0.4rem',
                marginTop: '0.75rem',
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.4)',
              }}>
                <span>Less</span>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#0e4429' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#006d32' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#26a641' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#39d353' }} />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* History Log */}
        <div>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={15} color="#3b82f6" /> Recent Solutions Log
          </h3>
          {history.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '1.25rem',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.82rem',
            }}>
              No problems logged yet today. Solve your first problem to ignite your streak!
            </div>
          ) : (
            <div style={{
              maxHeight: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}>
              {history.slice(0, 8).map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span style={{ fontWeight: 600, color: 'white' }}>{item.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.74rem' }}>
                    <span style={{
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}>
                      {item.language}
                    </span>
                    <span>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
