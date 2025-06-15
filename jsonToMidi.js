import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';

export function createMidiFromAst(ast) {
  const key = ast.headers.find(h => h.key === 'key')?.val || 'C_major';
  const tempo = parseInt(ast.headers.find(h => h.key === 'tempo')?.val || '120', 10);
  const baseVelocity = parseInt(ast.headers.find(h => h.key === 'velocity')?.val || '90', 10);

  const midi = new Midi();
  midi.header.setTempo(tempo);

  for (const track of ast.tracks) {
    const midiTrack = midi.addTrack();
    midiTrack.name = track.name;

    for (const line of track.lines) {
      const timeBeats = (line.bar - 1) * 4 + line.beat;
      const durationBeats = durationToBeats(line.duration);
      const timeSec = timeBeats * (60 / tempo);
      const durSec = durationBeats * (60 / tempo);
      const velocity = (line.velocity ?? baseVelocity) / 127;

      if (line.type === 'note') {
        if (line.note === 'x') continue;
        const midiNote = scaleDegreeToMidi(line.note, key, line.octave);
        midiTrack.addNote({ midi: midiNote, time: timeSec, duration: durSec, velocity });
      } else if (line.type === 'chord') {
        for (const n of line.notes) {
          const midiNote = scaleDegreeToMidi(n, key, line.octave);
          midiTrack.addNote({ midi: midiNote, time: timeSec, duration: durSec, velocity });
        }
      }
    }
  }

  return midi;
}

function durationToBeats(dur) {
  const map = {
    '1m': 4,
    '2n': 2,
    '4n': 1,
    '8n': 0.5,
    '16n': 0.25
  };
  return map[dur] ?? 1;
}

function scaleDegreeToMidi(degree, key, octave) {
  const scaleMap = {
    C_major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    A_minor: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  };
  const scale = scaleMap[key] ?? scaleMap['C_major'];
  let raw = degree.toString();
  let accidental = '';
  if (raw.includes('#')) accidental = '#';
  if (raw.includes('b')) accidental = 'b';
  const base = parseInt(raw[0], 10) - 1;
  const note = scale[base] + accidental;
  return Tone.Frequency(`${note}${octave}`).toMidi();
}
