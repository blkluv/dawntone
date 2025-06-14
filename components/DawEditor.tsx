'use client';
import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';

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
