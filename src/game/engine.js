import { BEATS, ANCHORS, FILLER, GARBLE } from "./content.js";

export const SPEED = 7; // game-seconds per real second (~30-min meeting ≈ 4.5 real minutes)
export const SCHEDULED_END = 30 * 60; // game-seconds
export const MAX_TRANSCRIPT = 60;

// Per game-second rates. Tuned for tension in Phase 6.
export const RATES = {
  focusDrainOn: 0.07, // camera on: attention costs Focus
  focusRegenOff: 0.15, // camera off: recover, at Visibility's expense
  visDriftOn: 0.012, // camera on: slow fade if you never speak
  visDecayOff: 0.11, // camera off: everyone notices the black tile
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const fmtClock = (gs) => {
  const s = Math.max(0, Math.floor(gs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Visibility Goldilocks zones
export const visibilityZone = (v) => (v < 18 ? "low" : v > 72 ? "high" : "mid");

export const currentBeat = (gameSeconds) => {
  let beat = BEATS[0];
  for (const b of BEATS) if (gameSeconds >= b.start) beat = b;
  return beat;
};

export function createGame() {
  return {
    gameSeconds: 0,
    focus: 100,
    visibility: 50,
    cameraOn: true,
    actionItems: 0,
    transcript: [], // {id, at, speakerId, text, muted, garbled}
    nextLineAt: 0,
    anchorIdx: 0,
    nextId: 1,
  };
}

const pick = (arr, rand) => arr[Math.floor(rand() * arr.length) % arr.length];

function pickWeighted(weights, rand) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let target = rand() * total;
  for (const [id, w] of entries) {
    target -= w;
    if (target < 0) return id;
  }
  return entries[entries.length - 1][0];
}

function emitLine(s, rand) {
  const anchor = ANCHORS[s.anchorIdx];
  let speakerId, text;
  let muted = false;
  if (anchor && s.gameSeconds >= anchor.at) {
    speakerId = anchor.speaker;
    text = anchor.text;
    s.anchorIdx += 1;
  } else {
    const beat = currentBeat(s.gameSeconds);
    speakerId = pickWeighted(beat.weights, rand);
    text = pick(FILLER[speakerId], rand);
    muted = speakerId === "mute";
  }
  const garbled = s.focus <= 0 && !muted;
  if (garbled) text = pick(GARBLE, rand);
  s.transcript = [
    ...s.transcript,
    { id: s.nextId, at: s.gameSeconds, speakerId, text, muted, garbled },
  ].slice(-MAX_TRANSCRIPT);
  s.nextId += 1;
  s.nextLineAt = s.gameSeconds + 8 + rand() * 8;
}

export function tick(s, dtReal, rand = Math.random) {
  const dt = dtReal * SPEED;
  const beat = currentBeat(s.gameSeconds);
  const n = { ...s };
  n.gameSeconds = s.gameSeconds + dt;
  if (n.cameraOn) {
    n.focus = clamp(n.focus - RATES.focusDrainOn * beat.drainMult * dt, 0, 100);
    n.visibility = clamp(n.visibility - RATES.visDriftOn * dt, 0, 100);
  } else {
    n.focus = clamp(n.focus + RATES.focusRegenOff * dt, 0, 100);
    n.visibility = clamp(n.visibility - RATES.visDecayOff * dt, 0, 100);
  }
  if (n.gameSeconds >= n.nextLineAt) emitLine(n, rand);
  return n;
}

export const toggleCamera = (s) => ({ ...s, cameraOn: !s.cameraOn });
