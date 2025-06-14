'use client';
import Editor, { loader } from '@monaco-editor/react';
import { useEffect, useState } from 'react';

// Load Monaco editor resources from the local public directory
loader.config({
  paths: {
    vs: '/vs',
  },
});

export default function DawEditor() {
  const [code, setCode] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('daw-src');
    if (stored) setCode(stored);
  }, []);

  const handleChange = (value?: string) => {
    const v = value ?? '';
    setCode(v);
    localStorage.setItem('daw-src', v);
  };

  return (
    <Editor
      className="editor"
      height="80vh"
      defaultLanguage="plaintext"
      value={code}
      onChange={handleChange}
      options={{ automaticLayout: true }}
    />
  );
}
