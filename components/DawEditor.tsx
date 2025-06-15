'use client';
import Editor, { loader } from '@monaco-editor/react';
import { useEffect, useState, useRef } from 'react';
import styles from './DawEditor.module.css';
import * as Tone from 'tone';

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
  const partsRef = useRef<Tone.Part[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);

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

  const handleExportMidi = async () => {
    const mod = await import('../daw_language_grammar.js');
    const parser = (mod.default ?? mod).parse;
    try {
      const ast = parser(code);
      const midiMod = await import('../jsonToMidi.js');
      const midi = midiMod.createMidiFromAst(ast);
      const uint8 = midi.toArray();
      const blob = new Blob([uint8], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'daw.mid';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export error: ' + err.message);
    }
  };

  const createTonePartFromTrack = (
    track: any,
    key: string,
    baseVelocity = 90,
    synthClass: typeof Tone.Synth = Tone.Synth
  ) => {
    const events: any[] = [];

    for (const line of track.lines) {
      if (line.type === 'note') {
        const time = `${line.bar}:${Math.floor(line.beat)}:${Math.round((line.beat % 1) * 4)}`;
        const duration = line.duration;
        const velocity = (line.velocity ?? baseVelocity) / 127;

        if (line.note === 'x') continue;

        const midi = scaleDegreeToMidi(line.note, key, line.octave);
        events.push({ time, note: midi, duration, velocity });
      }
      if (line.type === 'chord') {
        const time = `${line.bar}:${Math.floor(line.beat)}:${Math.round((line.beat % 1) * 4)}`;
        const duration = line.duration;
        const velocity = (line.velocity ?? baseVelocity) / 127;
        const midis = line.notes.map((n: any) => scaleDegreeToMidi(n, key, line.octave));
        events.push({ time, note: midis, duration, velocity });
      }
    }

    const synth = new Tone.PolySynth(synthClass).toDestination();
    const part = new Tone.Part((time, value) => {
      synth.triggerAttackRelease(value.note, value.duration, time, value.velocity);
    }, events);
    part.start(0);
    return part;
  };

  const scaleDegreeToMidi = (degree: any, key: string, octave: number) => {
    const scaleMap: Record<string, string[]> = {
      C_major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      A_minor: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    };
    const scale = scaleMap[key] ?? scaleMap['C_major'];
    let raw = degree.toString();
    let accidental = '';
    if (raw.includes('#')) accidental = '#';
    if (raw.includes('b')) accidental = 'b';
    const base = parseInt(raw[0], 10) - 1;
    const note = scale[base] + accidental;
    return Tone.Frequency(`${note}${octave}`).toMidi();
  };

  const getSynthClass = (name: string): typeof Tone.Synth => {
    switch (name.toLowerCase()) {
      case 'fm':
      case 'fmsynth':
        // Tone.FMSynth does not extend Tone.Synth directly,
        // but PolySynth accepts any Monophonic instrument
        // constructor. Cast to satisfy the expected type.
        return Tone.FMSynth as unknown as typeof Tone.Synth;
      case 'am':
      case 'amsynth':
        // Tone.AMSynth extends ModulationSynth which is not a
        // subclass of Tone.Synth, so cast accordingly.
        return Tone.AMSynth as unknown as typeof Tone.Synth;
      case 'duo':
      case 'duosynth':
        return Tone.DuoSynth as unknown as typeof Tone.Synth;
      case 'membrane':
      case 'membranesynth':
        // MembraneSynth extends Synth with extra options.
        // Cast to the base constructor type expected here.
        return Tone.MembraneSynth as unknown as typeof Tone.Synth;
      default:
        return Tone.Synth;
    }
  };

  const handlePlay = async () => {
    if (isPlaying) return;

    const mod = await import('../daw_language_grammar.js');
    const parser = (mod.default ?? mod).parse;

    let ast: any;
    try {
      ast = parser(code);
    } catch (err: any) {
      alert('Parse error: ' + err.message);
      return;
    }

    const key = ast.headers.find((h: any) => h.key === 'key')?.val || 'C_major';
    const vel = parseInt(
      ast.headers.find((h: any) => h.key === 'velocity')?.val || '90',
      10
    );
    const tempo = parseInt(
      ast.headers.find((h: any) => h.key === 'tempo')?.val || '120',
      10
    );
    const synthName = ast.headers.find((h: any) => h.key === 'synth')?.val || 'synth';
    const synthClass = getSynthClass(synthName);

    const parts = ast.tracks.map((t: any) =>
      createTonePartFromTrack(t, key, vel, synthClass)
    );
    partsRef.current = parts;

    const lastBar = Math.max(
      1,
      ...ast.tracks.flatMap((t: any) => t.lines.map((l: any) => l.bar + 1))
    );

    await Tone.start();
    Tone.Transport.bpm.value = tempo;
    Tone.Transport.loop = loop;
    Tone.Transport.loopEnd = `${lastBar}:0:0`;
    Tone.Transport.start();
    setIsPlaying(true);
  };

  const handleStop = () => {
    Tone.Transport.stop();
    partsRef.current.forEach((p) => p.dispose());
    partsRef.current = [];
    setIsPlaying(false);
  };


  return (
    <div className={styles.editorContainer}>
      <Editor
        className={styles.editor}
        defaultLanguage="plaintext"
        value={code}
        onChange={handleChange}
        options={{ automaticLayout: true }}
      />
      <div className={styles.buttonBar}>
        <button onClick={handlePlay} disabled={isPlaying}>Play</button>
        <button onClick={handleStop} disabled={!isPlaying}>Stop</button>
        <label>
          <input type="checkbox" checked={loop} onChange={() => setLoop(!loop)} /> Loop
        </label>
        <button onClick={handleExport}>Export JSON</button>
        <button onClick={handleExportMidi}>Export MIDI</button>
      </div>
    </div>
  );
}
