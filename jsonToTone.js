// json_to_tonejs.js
// JSON で構造化された daw を Tone.js のスケジュール形式に変換する関数

import * as Tone from "tone";

export function createTonePartFromTrack(track, key, baseVelocity = 90) {
  const events = [];

  for (const line of track.lines) {
    if (line.type === "note") {
      const time = `${line.bar}:${Math.floor(line.beat)}:${Math.round((line.beat % 1) * 4)}`;
      const duration = line.duration;
      const velocity = (line.velocity ?? baseVelocity) / 127;

      if (line.note === "x") continue; // 休符

      const midi = scaleDegreeToMidi(line.note, key, line.octave);
      events.push({ time, note: midi, duration, velocity });
    }
    if (line.type === "chord") {
      const time = `${line.bar}:${Math.floor(line.beat)}:${Math.round((line.beat % 1) * 4)}`;
      const duration = line.duration;
      const velocity = (line.velocity ?? baseVelocity) / 127;
      const midis = line.notes.map(n => scaleDegreeToMidi(n, key, line.octave));
      events.push({ time, note: midis, duration, velocity });
    }
  }

  const synth = new Tone.PolySynth(Tone.Synth).toDestination();
  const part = new Tone.Part((time, value) => {
    synth.triggerAttackRelease(value.note, value.duration, time, value.velocity);
  }, events);

  part.start(0);
  return part;
}

function scaleDegreeToMidi(degree, key, octave) {
  const scaleMap = {
    "C_major": ["C", "D", "E", "F", "G", "A", "B"],
    "A_minor": ["A", "B", "C", "D", "E", "F", "G"]
  };
  const scale = scaleMap[key] ?? scaleMap["C_major"];

  let raw = degree.toString();
  let accidental = "";
  if (raw.includes("#")) accidental = "#";
  if (raw.includes("b")) accidental = "b";

  const base = parseInt(raw[0], 10) - 1;
  const note = scale[base] + accidental;
  return Tone.Frequency(`${note}${octave}`).toMidi();
}
