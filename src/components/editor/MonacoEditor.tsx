import React, { useEffect, useRef } from 'react';
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';

/*
 * Lazy-loaded (see CodeEditorPanel) so Monaco never weighs on other pages.
 * The editor themes mirror the light and dark --editor-* tokens.
 */
const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('codepulse-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7394', fontStyle: 'italic' },
      { token: 'keyword', foreground: '8aa6ff' },
      { token: 'string', foreground: '7fd6a8' },
      { token: 'number', foreground: 'f2c06d' },
      { token: 'type', foreground: '7cc0f4' },
      { token: 'delimiter', foreground: 'a4aac4' },
    ],
    colors: {
      'editor.background': '#0b0f1d',
      'editor.foreground': '#d7dcef',
      'editorLineNumber.foreground': '#4a5170',
      'editorLineNumber.activeForeground': '#a4aac4',
      'editor.lineHighlightBackground': '#141a2e',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#2f5bea55',
      'editor.inactiveSelectionBackground': '#2f5bea30',
      'editorCursor.foreground': '#8aa6ff',
      'editorIndentGuide.background1': '#1c2238',
      'editorIndentGuide.activeBackground1': '#343b57',
      'editorWidget.background': '#0f1426',
      'editorWidget.border': '#242a42',
      'editorSuggestWidget.background': '#0f1426',
      'editorSuggestWidget.border': '#242a42',
      'editorSuggestWidget.selectedBackground': '#1f2640',
      'scrollbarSlider.background': '#ffffff14',
      'scrollbarSlider.hoverBackground': '#ffffff22',
      'scrollbarSlider.activeBackground': '#ffffff2e',
    },
  });

  monaco.editor.defineTheme('codepulse-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '767c96', fontStyle: 'italic' },
      { token: 'keyword', foreground: '2448c4' },
      { token: 'string', foreground: '0f6e44' },
      { token: 'number', foreground: '8a580a' },
      { token: 'type', foreground: '1d6aa6' },
      { token: 'delimiter', foreground: '4a5070' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#11152e',
      'editorLineNumber.foreground': '#9aa1be',
      'editorLineNumber.activeForeground': '#4a5070',
      'editor.lineHighlightBackground': '#f1f3f8',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#2f5bea25',
      'editor.inactiveSelectionBackground': '#2f5bea12',
      'editorCursor.foreground': '#2f5bea',
      'editorIndentGuide.background1': '#e2e5ee',
      'editorIndentGuide.activeBackground1': '#cbd0de',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#e2e5ee',
      'editorSuggestWidget.background': '#ffffff',
      'editorSuggestWidget.border': '#e2e5ee',
      'editorSuggestWidget.selectedBackground': '#ebf0ff',
      'scrollbarSlider.background': '#11152e14',
      'scrollbarSlider.hoverBackground': '#11152e22',
      'scrollbarSlider.activeBackground': '#11152e2e',
    },
  });
};

export interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  /** Block Ctrl/Cmd+V and the DOM paste event (exam lockdown). */
  blockPaste?: boolean;
  /** Ctrl/⌘+Enter */
  onRun?: () => void;
  /** Ctrl/⌘+Shift+Enter */
  onSubmit?: () => void;
  ariaLabel?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ value, language, onChange, readOnly, blockPaste, onRun, onSubmit, ariaLabel }) => {
  const { resolved } = useTheme();
  const activeTheme = resolved === 'dark' ? 'codepulse-dark' : 'codepulse-light';

  // Shortcuts are registered once at mount; refs keep them pointing at the latest handlers
  const runRef = useRef(onRun);
  const submitRef = useRef(onSubmit);
  useEffect(() => {
    runRef.current = onRun;
    submitRef.current = onSubmit;
  }, [onRun, onSubmit]);

  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => submitRef.current?.());

    if (blockPaste) {
      // Block Ctrl/Cmd+V and Shift+Insert at the Monaco keybinding level
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {});

      // Block DOM-level paste events on Monaco's container (right-click paste, etc.)
      const domNode = editor.getDomNode();
      if (domNode) {
        domNode.addEventListener('paste', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      }
    }

    if (!window.matchMedia('(pointer: coarse)').matches) editor.focus();
  };

  return (
    <Editor
      height="100%"
      theme={activeTheme}
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      beforeMount={defineTheme}
      onMount={handleMount}
      loading={null}
      options={{
        readOnly,
        ariaLabel: ariaLabel ?? 'Code editor',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 13.5,
        lineHeight: 22,
        fontLigatures: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        padding: { top: 14, bottom: 14 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'off',
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        guides: { indentation: true },
        bracketPairColorization: { enabled: true },
        stickyScroll: { enabled: false },
        contextmenu: !blockPaste,
      }}
    />
  );
};

export default MonacoEditor;
