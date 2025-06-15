'use client';
import Editor, { loader } from '@monaco-editor/react';
import { useEffect, useState, useRef } from 'react';

// Determine Monaco asset path from environment variable or fallback
const monacoPath = process.env.NEXT_PUBLIC_MONACO_PATH ?? '/vs';

// Load Monaco editor resources from the local public directory
loader.config({
  paths: {
    vs: monacoPath,
  },
});

export default function DawEditor() {
  const [code, setCode] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('daw-src');
    if (stored) setCode(stored);
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem('daw-src', code);
    }, 300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [code]);

  const handleChange = (value?: string) => {
    const v = value ?? '';
    setCode(v);
  };

  const handleExport = async () => {
    const mod = await import('../daw_language_grammar.js');
    const parser = (mod.default ?? mod).parse;
    try {
      const ast = parser(code);
      const blob = new Blob([JSON.stringify(ast, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'daw.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Parse error: ' + err.message);
    }
  };

  return (
    <div>
      <Editor
        className="editor"
        height="80vh"
        defaultLanguage="plaintext"
        value={code}
        onChange={handleChange}
        options={{ automaticLayout: true }}
      />
      <button onClick={handleExport}>Export JSON</button>
    </div>
  );
}
