import { openDB } from 'idb';

const DB_NAME = 'offline-leetcode';
const DB_VERSION = 4;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
        if (oldVersion < 1) db.createObjectStore('submissions');
        if (oldVersion < 2) db.createObjectStore('solved');
        if (oldVersion < 3) {
            if (!db.objectStoreNames.contains('activity')) {
                db.createObjectStore('activity');
            }
            if (!db.objectStoreNames.contains('history')) {
                db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
            }
        }
        if (oldVersion < 4) {
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes'); // problemId -> markdown string
            }
            if (!db.objectStoreNames.contains('spaced_repetition')) {
                db.createObjectStore('spaced_repetition'); // problemId -> { nextReviewDate, intervalDays, easeFactor, repetitions }
            }
        }
    },
});

// ----------------------------------------------------
// Native Desktop Storage Bridge (Neutralino.storage)
// ----------------------------------------------------
async function syncNativeStorage(key, value) {
    if (typeof window !== 'undefined' && window.Neutralino?.storage) {
        try {
            await window.Neutralino.storage.setData(key, JSON.stringify(value));
        } catch {
            // Silently fallback if not in native desktop mode
        }
    }
}

async function getNativeStorage(key) {
    if (typeof window !== 'undefined' && window.Neutralino?.storage) {
        try {
            const raw = await window.Neutralino.storage.getData(key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }
    return null;
}

export function getLocalDateStr(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export async function saveCode(problemId, language, code) {
    const db = await dbPromise;
    await db.put('submissions', code, `${problemId}-${language}`);
    syncNativeStorage(`code_${problemId}_${language}`, code);
}

export async function getCode(problemId, language) {
    const db = await dbPromise;
    const dbVal = await db.get('submissions', `${problemId}-${language}`);
    if (dbVal !== undefined) return dbVal;
    return getNativeStorage(`code_${problemId}_${language}`);
}

// ----------------------------------------------------
// Personal Pattern Notes API
// ----------------------------------------------------
export async function saveNote(problemId, noteText) {
    const db = await dbPromise;
    await db.put('notes', noteText, String(problemId));
    localStorage.setItem(`devdrill_note_${problemId}`, noteText);
    syncNativeStorage(`note_${problemId}`, noteText);
}

export async function getNote(problemId) {
    const db = await dbPromise;
    const dbNote = await db.get('notes', String(problemId));
    if (dbNote !== undefined) return dbNote;
    const local = localStorage.getItem(`devdrill_note_${problemId}`);
    if (local !== null) return local;
    return (await getNativeStorage(`note_${problemId}`)) || '';
}

// ----------------------------------------------------
// Spaced Repetition (Anki-style Review Queue) API
// ----------------------------------------------------
export async function scheduleReview(problemId, quality = 'good') {
    // quality: 'hard' (2 days), 'good' (5 days), 'easy' (14 days)
    const db = await dbPromise;
    const now = new Date();
    let daysToAdd = 5;
    if (quality === 'hard') daysToAdd = 2;
    if (quality === 'good') daysToAdd = 5;
    if (quality === 'easy') daysToAdd = 14;

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    const nextDateStr = getLocalDateStr(nextDate);

    const record = {
        problemId,
        lastReviewed: getLocalDateStr(now),
        nextReviewDate: nextDateStr,
        intervalDays: daysToAdd,
        quality,
    };

    await db.put('spaced_repetition', record, String(problemId));

    // Also cache review items in localStorage for fast UI filtering
    let reviews = {};
    try {
        reviews = JSON.parse(localStorage.getItem('devdrill_reviews') || '{}');
    } catch {
        reviews = {};
    }
    reviews[problemId] = record;
    localStorage.setItem('devdrill_reviews', JSON.stringify(reviews));

    return record;
}

export async function getDueReviews() {
    let reviews = {};
    try {
        reviews = JSON.parse(localStorage.getItem('devdrill_reviews') || '{}');
    } catch {
        reviews = {};
    }

    const todayStr = getLocalDateStr();
    const dueIds = new Set();

    for (const [id, rec] of Object.entries(reviews)) {
        if (rec.nextReviewDate && rec.nextReviewDate <= todayStr) {
            dueIds.add(Number(id) || id);
        }
    }

    return dueIds;
}

export async function getReviewRecord(problemId) {
    try {
        const reviews = JSON.parse(localStorage.getItem('devdrill_reviews') || '{}');
        return reviews[problemId] || null;
    } catch {
        return null;
    }
}

// ----------------------------------------------------
// Solved & Activity Streaks API
// ----------------------------------------------------
export async function markSolved(problemId, problemTitle = '', language = 'python') {
    const db = await dbPromise;
    await db.put('solved', true, problemId);

    const todayStr = getLocalDateStr();
    const timestamp = Date.now();

    // 1. Update activity in localStorage for fast UI rendering
    let activity = {};
    try {
        activity = JSON.parse(localStorage.getItem('offcode_activity') || '{}');
    } catch {
        activity = {};
    }

    if (!activity[todayStr]) {
        activity[todayStr] = { count: 0, problems: [] };
    }
    if (!activity[todayStr].problems.includes(problemId)) {
        activity[todayStr].problems.push(problemId);
        activity[todayStr].count = activity[todayStr].problems.length;
    }
    localStorage.setItem('offcode_activity', JSON.stringify(activity));

    // 2. Update history log in localStorage
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('offcode_history') || '[]');
    } catch {
        history = [];
    }

    history.unshift({
        id: timestamp,
        problemId,
        title: problemTitle || `Problem #${problemId}`,
        date: todayStr,
        timestamp,
        language,
    });
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem('offcode_history', JSON.stringify(history));

    // 3. Persist to IndexedDB
    try {
        await db.put('activity', activity[todayStr], todayStr);
        await db.add('history', {
            problemId,
            title: problemTitle || `Problem #${problemId}`,
            date: todayStr,
            timestamp,
            language,
        });
    } catch (err) {
        console.warn('[Storage] Error saving activity to IndexedDB:', err);
    }

    // 4. Mirror to native desktop storage for permanent disk safety
    syncNativeStorage('offcode_activity', activity);
    syncNativeStorage('offcode_history', history);
    syncNativeStorage(`solved_${problemId}`, true);
}

export async function getAllSolved() {
    const db = await dbPromise;
    const keys = await db.getAllKeys('solved');
    const set = new Set(keys);

    // Cross-check native desktop storage if running in desktop mode
    if (typeof window !== 'undefined' && window.Neutralino?.storage) {
        try {
            const allStorageKeys = await window.Neutralino.storage.getKeys();
            for (const k of allStorageKeys) {
                if (k.startsWith('solved_')) {
                    const pid = k.replace('solved_', '');
                    set.add(Number(pid) || pid);
                }
            }
        } catch {
            // Silently ignore if not in native desktop mode
        }
    }

    return set;
}

export function calculateStreak(datesSet) {
    if (!datesSet || datesSet.size === 0) {
        return { currentStreak: 0, maxStreak: 0 };
    }

    const sortedDates = Array.from(datesSet).sort();
    let maxStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const dStr of sortedDates) {
        const [y, m, d] = dStr.split('-').map(Number);
        const curr = new Date(y, m - 1, d);
        if (prevDate) {
            const diffTime = curr - prevDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                tempStreak = 1;
            }
        } else {
            tempStreak = 1;
        }
        prevDate = curr;
        if (tempStreak > maxStreak) {
            maxStreak = tempStreak;
        }
    }

    const today = new Date();
    const todayStr = getLocalDateStr(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    let currentStreak = 0;
    let checkDate = null;

    if (datesSet.has(todayStr)) {
        currentStreak = 1;
        checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
    } else if (datesSet.has(yesterdayStr)) {
        currentStreak = 1;
        checkDate = new Date(yesterday);
        checkDate.setDate(checkDate.getDate() - 1);
    }

    if (checkDate) {
        while (true) {
            const dStr = getLocalDateStr(checkDate);
            if (datesSet.has(dStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }

    return { currentStreak, maxStreak };
}

export async function getActivityData() {
    let activity = {};
    let history = [];

    try {
        activity = JSON.parse(localStorage.getItem('offcode_activity') || '{}');
        history = JSON.parse(localStorage.getItem('offcode_history') || '[]');
    } catch {
        activity = {};
        history = [];
    }

    const db = await dbPromise;

    // If history in localStorage is empty, try recovering from IndexedDB 'history' store
    if (history.length === 0) {
        try {
            const dbHistory = await db.getAll('history');
            if (dbHistory && dbHistory.length > 0) {
                history = dbHistory.reverse();
                localStorage.setItem('offcode_history', JSON.stringify(history));
            }
        } catch (e) {
            console.warn('[Storage] Could not read from IndexedDB history:', e);
        }
    }

    // If activity in localStorage is empty, try recovering from IndexedDB 'activity' store
    if (Object.keys(activity).length === 0) {
        try {
            const dbKeys = await db.getAllKeys('activity');
            for (const k of dbKeys) {
                activity[k] = await db.get('activity', k);
            }
            if (Object.keys(activity).length > 0) {
                localStorage.setItem('offcode_activity', JSON.stringify(activity));
            }
        } catch (e) {
            console.warn('[Storage] Could not read from IndexedDB activity:', e);
        }
    }

    // Recover from native desktop disk backup if still empty
    if (history.length === 0) {
        const nativeHistory = await getNativeStorage('offcode_history');
        if (nativeHistory && nativeHistory.length > 0) {
            history = nativeHistory;
            localStorage.setItem('offcode_history', JSON.stringify(history));
        }
    }
    if (Object.keys(activity).length === 0) {
        const nativeActivity = await getNativeStorage('offcode_activity');
        if (nativeActivity && Object.keys(nativeActivity).length > 0) {
            activity = nativeActivity;
            localStorage.setItem('offcode_activity', JSON.stringify(activity));
        }
    }

    const solvedSet = await getAllSolved();
    if (Object.keys(activity).length === 0 && solvedSet.size > 0) {
        const todayStr = getLocalDateStr();
        activity[todayStr] = {
            count: solvedSet.size,
            problems: Array.from(solvedSet)
        };
        localStorage.setItem('offcode_activity', JSON.stringify(activity));
    }

    const activeDates = new Set(Object.keys(activity).filter(k => activity[k].count > 0));
    const { currentStreak, maxStreak } = calculateStreak(activeDates);

    return {
        activity,
        history,
        currentStreak,
        maxStreak,
        activeDays: activeDates.size,
        totalSolved: solvedSet.size,
    };
}

// ----------------------------------------------------
// Data Backup, Export & Restore API
// ----------------------------------------------------
export async function exportAllData() {
    const db = await dbPromise;
    const solvedSet = await getAllSolved();
    const activityData = await getActivityData();

    // Notes
    const notes = {};
    try {
        const noteKeys = await db.getAllKeys('notes');
        for (const k of noteKeys) {
            notes[k] = await db.get('notes', k);
        }
    } catch (e) {
        console.warn('Export notes error:', e);
    }

    // Spaced repetition
    const spacedRepetition = {};
    try {
        const srKeys = await db.getAllKeys('spaced_repetition');
        for (const k of srKeys) {
            spacedRepetition[k] = await db.get('spaced_repetition', k);
        }
    } catch (e) {
        console.warn('Export spaced_repetition error:', e);
    }

    // Editor settings
    const settings = {
        fontSize: localStorage.getItem('devdrill_editor_fontsize') || '14',
        fontFamily: localStorage.getItem('devdrill_editor_fontfamily') || 'Menlo, monospace',
        tabSize: localStorage.getItem('devdrill_editor_tabsize') || '4',
        minimap: localStorage.getItem('devdrill_editor_minimap') === 'true',
        wordWrap: localStorage.getItem('devdrill_editor_wordwrap') !== 'false',
        lineNumbers: localStorage.getItem('devdrill_editor_linenumbers') !== 'false',
        theme: localStorage.getItem('offcode_theme') || 'dark',
    };

    return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        solved: Array.from(solvedSet),
        activity: activityData.activity,
        history: activityData.history,
        notes,
        spacedRepetition,
        settings,
    };
}

export async function importAllData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid backup file format');

    const db = await dbPromise;

    // Restore solved
    if (Array.isArray(data.solved)) {
        for (const id of data.solved) {
            await markSolved(id);
        }
    }

    // Restore activity & history
    if (data.activity) {
        localStorage.setItem('offcode_activity', JSON.stringify(data.activity));
        syncNativeStorage('offcode_activity', data.activity);
    }
    if (Array.isArray(data.history)) {
        localStorage.setItem('offcode_history', JSON.stringify(data.history));
        syncNativeStorage('offcode_history', data.history);
    }

    // Restore notes
    if (data.notes && typeof data.notes === 'object') {
        for (const [id, note] of Object.entries(data.notes)) {
            await saveNote(id, note);
        }
    }

    // Restore spaced repetition
    if (data.spacedRepetition && typeof data.spacedRepetition === 'object') {
        for (const [id, rec] of Object.entries(data.spacedRepetition)) {
            await db.put('spaced_repetition', rec, String(id));
        }
    }

    // Restore settings
    if (data.settings) {
        if (data.settings.fontSize) localStorage.setItem('devdrill_editor_fontsize', data.settings.fontSize);
        if (data.settings.fontFamily) localStorage.setItem('devdrill_editor_fontfamily', data.settings.fontFamily);
        if (data.settings.tabSize) localStorage.setItem('devdrill_editor_tabsize', data.settings.tabSize);
        if (data.settings.minimap !== undefined) localStorage.setItem('devdrill_editor_minimap', String(data.settings.minimap));
        if (data.settings.wordWrap !== undefined) localStorage.setItem('devdrill_editor_wordwrap', String(data.settings.wordWrap));
        if (data.settings.lineNumbers !== undefined) localStorage.setItem('devdrill_editor_linenumbers', String(data.settings.lineNumbers));
        if (data.settings.theme) localStorage.setItem('offcode_theme', data.settings.theme);
    }

    return true;
}

export async function resetAllData() {
    const db = await dbPromise;
    try {
        await db.clear('solved');
        await db.clear('activity');
        await db.clear('history');
        await db.clear('notes');
        await db.clear('spaced_repetition');
        await db.clear('submissions');
    } catch (e) {
        console.warn('DB clear error:', e);
    }

    localStorage.removeItem('offcode_solved');
    localStorage.removeItem('offcode_activity');
    localStorage.removeItem('offcode_history');
    return true;
}
