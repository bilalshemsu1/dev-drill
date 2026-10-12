import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Check, RotateCcw, FileCode } from 'lucide-react';
import Timer from './Timer';

function getStoredEditorSettings() {
    return {
        fontSize: parseInt(localStorage.getItem('devdrill_editor_fontsize') || '14', 10),
        fontFamily: localStorage.getItem('devdrill_editor_fontfamily') || "'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
        tabSize: parseInt(localStorage.getItem('devdrill_editor_tabsize') || '4', 10),
        minimap: localStorage.getItem('devdrill_editor_minimap') === 'true',
        lineNumbers: localStorage.getItem('devdrill_editor_linenumbers') !== 'false' ? 'on' : 'off',
        wordWrap: localStorage.getItem('devdrill_editor_wordwrap') !== 'false' ? 'on' : 'off',
    };
}

export default function EditorPanel({
    language,
    setLanguage,
    code,
    setCode,
    monacoTheme,
    onRun,
    onSubmit,
    onReset,
    isRunning,
    onCursorChange,
}) {
    const [settings, setSettings] = useState(getStoredEditorSettings);

    useEffect(() => {
        const handleSettingsChanged = () => {
            setSettings(getStoredEditorSettings());
        };
        window.addEventListener('devdrill_settings_updated', handleSettingsChanged);
        window.addEventListener('storage', handleSettingsChanged);
        return () => {
            window.removeEventListener('devdrill_settings_updated', handleSettingsChanged);
            window.removeEventListener('storage', handleSettingsChanged);
        };
    }, []);

    const handleEditorDidMount = (editor) => {
        editor.onDidChangeCursorPosition((e) => {
            if (onCursorChange) {
                onCursorChange({
                    lineNumber: e.position.lineNumber,
                    column: e.position.column,
                });
            }
        });
    };

    const fileName = language === 'python' ? 'solution.py' : 'solution.js';

    return (
        <div
            className="panel workspace-panel"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: 'none',
                borderRadius: 0,
                background: 'var(--bg-main)',
            }}
        >
            {/* Integrated Desktop Editor Toolbar */}
            <div
                className="panel-header"
                style={{
                    height: '35px',
                    minHeight: '35px',
                    padding: '0 0.65rem',
                    borderBottom: '1px solid var(--bg-panel-border)',
                    background: 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                {/* Left: Active File Tab + Language Switcher + Timer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', height: '100%' }}>
                    {/* Active File Tab */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            height: '100%',
                            padding: '0 0.5rem',
                            borderBottom: '2px solid var(--accent-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            userSelect: 'none',
                        }}
                    >
                        <FileCode size={13} color="var(--accent-primary)" />
                        <span>{fileName}</span>
                    </div>

                    <div style={{ width: '1px', height: '14px', background: 'var(--bg-panel-border)' }} />

                    {/* Language Dropdown */}
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="custom-select"
                        style={{
                            padding: '0.15rem 1.6rem 0.15rem 0.55rem',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            height: '24px',
                            borderRadius: '5px',
                            background: 'transparent',
                            border: '1px solid var(--bg-panel-border)',
                        }}
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                    </select>

                    <div style={{ width: '1px', height: '14px', background: 'var(--bg-panel-border)' }} />

                    {/* Timer */}
                    <Timer />
                </div>

                {/* Right: Code Execution Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {onReset && (
                        <button
                            className="btn btn-secondary"
                            onClick={onReset}
                            title="Reset code to default template"
                            style={{
                                padding: '0 0.55rem',
                                height: '24px',
                                fontSize: '0.74rem',
                                borderRadius: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                background: 'transparent',
                                border: '1px solid var(--bg-panel-border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <RotateCcw size={11} />
                            <span>Reset</span>
                        </button>
                    )}

                    <button
                        className="btn btn-secondary"
                        disabled={isRunning}
                        onClick={onRun}
                        title="Run Test Cases [Ctrl + Enter]"
                        style={{
                            padding: '0 0.65rem',
                            height: '24px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            borderRadius: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--bg-panel-border)',
                        }}
                    >
                        {isRunning ? <div className="loader" /> : <Play size={11} fill="currentColor" />}
                        <span>Run</span>
                    </button>

                    <button
                        className="btn btn-success"
                        disabled={isRunning}
                        onClick={onSubmit}
                        title="Submit Solution [Ctrl + Shift + Enter]"
                        style={{
                            padding: '0 0.75rem',
                            height: '24px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            borderRadius: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                        }}
                    >
                        {isRunning ? <div className="loader" /> : <Check size={12} strokeWidth={2.5} />}
                        <span>Submit</span>
                    </button>
                </div>
            </div>

            {/* Monaco Editor Container */}
            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <Editor
                    height="100%"
                    language={language}
                    theme={monacoTheme || 'vs-dark'}
                    value={code}
                    onMount={handleEditorDidMount}
                    onChange={(val) => setCode(val || '')}
                    options={{
                        minimap: { enabled: settings.minimap },
                        fontSize: settings.fontSize,
                        fontFamily: settings.fontFamily,
                        tabSize: settings.tabSize,
                        lineNumbers: settings.lineNumbers,
                        wordWrap: settings.wordWrap,
                        padding: { top: 12 },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        automaticLayout: true,
                        lineNumbersMinChars: 3,
                    }}
                />
            </div>
        </div>
    );
}
