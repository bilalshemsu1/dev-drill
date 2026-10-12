import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, CheckCircle, Check, Search } from 'lucide-react';

const DIFFICULTY_COLOR = {
  Easy: '#10b981',
  Medium: '#f59e0b',
  Hard: '#ef4444',
};

const TOPIC_COLOR = {
  'Arrays': '#3b82f6',
  'Sliding Window': '#8b5cf6',
  'String': '#ec4899',
  'Trees': '#10b981',
  'Trie': '#06b6d4',
  'Heap': '#f59e0b',
  'Graphs': '#f97316',
  'Dynamic Programming': '#a855f7',
  'Intervals': '#14b8a6',
  'Linked List': '#6366f1',
  'Matrix': '#84cc16',
  'Bit Manipulation': '#94a3b8',
  'Stack': '#e11d48',
  'Binary Search': '#0ea5e9',
  'Backtracking': '#d97706',
  'Greedy': '#10b981',
  'Math': '#f43f5e',
};

export default function ProblemSelector({ problems, currentIndex, solvedSet, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('All');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const current = problems[currentIndex];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        const portal = document.getElementById('problem-selector-portal');
        if (portal && portal.contains(e.target)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setOpen(o => !o);
  };

  const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
  const medCount = problems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'Hard').length;

  const filtered = problems.filter(p => {
    const matchesDiff = diffFilter === 'All' || p.difficulty === diffFilter;
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.topic.toLowerCase().includes(search.toLowerCase()) ||
      p.difficulty.toLowerCase().includes(search.toLowerCase());
    return matchesDiff && matchesSearch;
  });

  const solved = problems.filter(p => solvedSet.has(p.id) || solvedSet.has(Number(p.id))).length;
  const total = problems.length;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const isCurrentSolved = current && (solvedSet.has(current.id) || solvedSet.has(Number(current.id)));

  const dropdown = open && ReactDOM.createPortal(
    <div
      id="problem-selector-portal"
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: Math.max(8, Math.min(dropdownPos.left, (window.innerWidth || 400) - Math.min((window.innerWidth || 400) - 16, Math.max(dropdownPos.width, 420)) - 8)),
        width: Math.min((window.innerWidth || 400) - 16, Math.max(dropdownPos.width, 420)),
        maxWidth: 'calc(100vw - 16px)',
        background: 'var(--bg-main)',
        border: '1px solid var(--bg-panel-border)',
        borderRadius: '10px',
        zIndex: 9999,
        boxShadow: '0 20px 45px rgba(0,0,0,0.45)',
        overflow: 'hidden',
      }}
    >
      {/* Progress bar + stats */}
      <div style={{ padding: '0.75rem 1rem 0.6rem', borderBottom: '1px solid var(--bg-panel-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>TRACK PROGRESS</span>
          <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{solved} / {total} solved ({pct}%)</span>
        </div>
        <div style={{ height: '3px', background: 'var(--bg-panel-border)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Difficulty Filters */}
      <div style={{ display: 'flex', gap: '0.35rem', padding: '0.45rem 0.75rem', borderBottom: '1px solid var(--bg-panel-border)', background: 'var(--bg-panel)' }}>
        {[
          { key: 'All', label: `ALL (${total})` },
          { key: 'Easy', label: `EASY (${easyCount})`, color: '#10b981' },
          { key: 'Medium', label: `MED (${medCount})`, color: '#f59e0b' },
          { key: 'Hard', label: `HARD (${hardCount})`, color: '#ef4444' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setDiffFilter(f.key)}
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              border: `1px solid ${diffFilter === f.key ? (f.color || 'var(--text-primary)') : 'transparent'}`,
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              background: diffFilter === f.key
                ? (f.color ? `${f.color}15` : 'rgba(255,255,255,0.08)')
                : 'transparent',
              color: diffFilter === f.key
                ? (f.color || 'var(--text-primary)')
                : 'var(--text-tertiary)',
              transition: 'all 0.15s ease'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--bg-panel-border)' }}>
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter problems by title or topic..."
          style={{
            width: '100%', background: 'var(--bg-panel)',
            border: '1px solid var(--bg-panel-border)', borderRadius: '6px',
            padding: '0.4rem 0.65rem', color: 'var(--text-primary)', fontSize: '0.8rem',
            outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Problem list */}
      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            No problems match filter
          </div>
        )}
        {filtered.map((p) => {
          const idx = problems.indexOf(p);
          const isSolved = solvedSet.has(p.id) || solvedSet.has(Number(p.id));
          const isActive = idx === currentIndex;

          return (
            <div
              key={p.id}
              onClick={() => { onSelect(idx); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.48rem 0.85rem', cursor: 'pointer',
                background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-panel)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(59,130,246,0.12)' : 'transparent'; }}
            >
              {/* Status indicator */}
              <div style={{ width: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSolved
                  ? <Check size={13} color="#10b981" strokeWidth={2.5} />
                  : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bg-panel-border)' }} />
                }
              </div>

              {/* Monospace Number */}
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', width: '32px', flexShrink: 0 }}>
                #{String(p.id || (idx + 1)).padStart(3, '0')}
              </span>

              {/* Title */}
              <span style={{ flex: 1, fontSize: '0.82rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 600 : 500 }}>
                {p.title}
              </span>

              {/* Topic chip */}
              {p.topic && (
                <span style={{
                  fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '3px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--bg-panel-border)',
                  color: 'var(--text-tertiary)',
                  flexShrink: 0, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                }}>
                  {p.topic}
                </span>
              )}

              {/* Difficulty chip */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '0.66rem', padding: '0.1rem 0.4rem', borderRadius: '3px',
                background: `${DIFFICULTY_COLOR[p.difficulty]}14`,
                border: `1px solid ${DIFFICULTY_COLOR[p.difficulty]}30`,
                color: DIFFICULTY_COLOR[p.difficulty],
                flexShrink: 0, fontWeight: 700, fontFamily: 'var(--font-mono)',
              }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: DIFFICULTY_COLOR[p.difficulty] }} />
                {p.difficulty}
              </span>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%', minWidth: '220px' }}>
      {/* Flat Desktop Breadcrumb Trigger */}
      <button
        onClick={handleOpen}
        title="Browse problem catalog [Ctrl+P / Search]"
        style={{
          width: '100%',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: open ? 'var(--bg-panel)' : 'transparent',
          border: `1px solid ${open ? 'var(--accent-primary)' : 'transparent'}`,
          borderRadius: '6px',
          padding: '0 0.5rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-sans)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'var(--bg-panel)';
            e.currentTarget.style.borderColor = 'var(--bg-panel-border)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        {/* Monospace Problem ID */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'var(--text-tertiary)',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          #{String(current?.id || (currentIndex + 1)).padStart(3, '0')}
        </span>

        {/* Problem Title */}
        <span style={{
          flex: 1,
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          {current?.title || ''}
        </span>

        {/* Solved checkmark */}
        {isCurrentSolved && (
          <Check size={12} color="#10b981" strokeWidth={2.5} style={{ flexShrink: 0 }} />
        )}

        {/* Minimal Difficulty Pill */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '0.66rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          padding: '0.05rem 0.35rem',
          borderRadius: '4px',
          color: DIFFICULTY_COLOR[current?.difficulty || 'Easy'],
          background: `${DIFFICULTY_COLOR[current?.difficulty || 'Easy']}15`,
          flexShrink: 0,
        }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: DIFFICULTY_COLOR[current?.difficulty || 'Easy'] }} />
          {current?.difficulty || 'Easy'}
        </span>

        {/* Minimal Chevron */}
        <ChevronDown
          size={11}
          style={{ flexShrink: 0, opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {dropdown}
    </div>
  );
}
