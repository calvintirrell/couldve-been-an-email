import { BEATS, ANCHORS, FILLER, GARBLE, BAD_NEWS, WRONG_ANSWERS, GARBLED_OPTIONS } from "./content.js";

export const SPEED = 7; // game-seconds per real second (~30-min meeting ≈ 4.5 real minutes)
export const SCHEDULED_END = 30 * 60; // game-seconds
export const MAX_TRANSCRIPT = 60;
export const NOD_WINDOW = 24.5; // 3.5 real seconds
export const QUIZ_WINDOW = 42; // 6 real seconds
export const BAIT_CHANCE = 0.2;

// Per game-second rates. Tuned for tension in Phase 6.
export const RATES = {
  focusDrainOn: 0.07, // camera on: attention costs Focus
  focusRegenOff: 0.15, // camera off: recover, at Visibility's expense
  visDriftOn: 0.012, // camera on: slow fade if you never speak
  visDecayOff: 0.11, // camera off: everyone notices the black tile
};

export const COOLDOWNS = {
  offline: 630, // "let's take this offline" (~90 real seconds)
  goodPoint: 140, // (~20 real seconds)
  breakingUp: 210, // (~30 real seconds), 2 uses per game
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

export const onCooldown = (s, id) => (s.cooldowns[id] || 0) > s.gameSeconds;
export const cooldownLeftReal = (s, id) =>
  Math.max(0, Math.ceil(((s.cooldowns[id] || 0) - s.gameSeconds) / SPEED));

export function createGame() {
  return {
    gameSeconds: 0,
    meetingEnd: SCHEDULED_END,
    focus: 100,
    visibility: 50,
    cameraOn: true,
    actionItems: 0,
    transcript: [], // {id, at, speakerId, text, muted, garbled}
    nextLineAt: 0,
    anchorIdx: 0,
    nextId: 1,
    prompt: null, // {type:'nod'|'quiz', ...}
    nextNodAt: 60,
    nextQuizAt: 240,
    cooldowns: {},
    breakingUpUses: 0,
    hardStopUsed: false,
    calmUntil: 0, // "take this offline" suppresses tangent drain until here
    flags: {}, // incoherent, etc — endings wired in Phase 5
    stats: { nods: 0, badNods: 0, words: 0, quizRight: 0, quizWrong: 0, quizMeh: 0 },
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

function pushLine(s, line) {
  s.transcript = [...s.transcript, { id: s.nextId, at: s.gameSeconds, ...line }].slice(-MAX_TRANSCRIPT);
  s.nextId += 1;
}

const sys = (s, text) => pushLine(s, { speakerId: "sys", text, muted: false, garbled: false });

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
  pushLine(s, { speakerId, text, muted, garbled });
  s.nextLineAt = s.gameSeconds + 8 + rand() * 8;
}

// ---------- PROMPTS ----------

const snippet = (text) => {
  const words = text.replace(/["""]/g, "").split(/\s+/).filter(Boolean);
  return words.slice(0, 5).join(" ") + (words.length > 5 ? "…" : "");
};

function spawnNod(s, rand) {
  const bait = rand() < BAIT_CHANCE;
  if (bait) {
    pushLine(s, { speakerId: "boss", text: pick(BAD_NEWS, rand), muted: false, garbled: s.focus <= 0 });
  }
  const last = s.transcript[s.transcript.length - 1];
  if (!last) return;
  const speakerId = last.speakerId === "sys" ? "boss" : last.speakerId;
  s.prompt = { type: "nod", bait, speakerId, expiresAt: s.gameSeconds + NOD_WINDOW };
  s.nextNodAt = s.gameSeconds + 50 + rand() * 40;
}

// Latest real (non-system, non-muted) line is what you'd be expected to react to.
function findQuizSource(s) {
  for (let i = s.transcript.length - 1; i >= 0; i--) {
    const l = s.transcript[i];
    if (l.speakerId !== "sys" && !l.muted) return l;
  }
  return null;
}

function spawnQuiz(s, rand) {
  const source = findQuizSource(s);
  if (!source) return;
  const garbled = source.garbled || s.focus <= 0;
  pushLine(s, { speakerId: "boss", text: "I'd love your take here. Thoughts?", muted: false, garbled: false });

  let options;
  const correctIdx = Math.floor(rand() * 3) % 3;
  if (garbled) {
    const base = Math.floor(rand() * GARBLED_OPTIONS.length);
    options = [0, 1, 2].map((i) => ({
      text: GARBLED_OPTIONS[(base + i) % GARBLED_OPTIONS.length],
      correct: i === correctIdx,
    }));
  } else {
    const w1 = Math.floor(rand() * WRONG_ANSWERS.length);
    const w2 = (w1 + 1 + Math.floor(rand() * (WRONG_ANSWERS.length - 1))) % WRONG_ANSWERS.length;
    const wrongs = [WRONG_ANSWERS[w1], WRONG_ANSWERS[w2]];
    options = [0, 1, 2].map((i) => ({
      text:
        i === correctIdx
          ? `Agreed — especially the point about "${snippet(source.text)}"`
          : wrongs.shift(),
      correct: i === correctIdx,
    }));
  }
  s.prompt = { type: "quiz", options, garbled, expiresAt: s.gameSeconds + QUIZ_WINDOW };
  s.nextQuizAt = s.gameSeconds + 200 + rand() * 120;
}

function expirePrompt(s) {
  if (s.prompt.type === "quiz") {
    s.visibility = clamp(s.visibility - 9, 0, 100);
    sys(s, "You froze. The silence developed a personality.");
  }
  s.prompt = null;
}

// ---------- TICK ----------

export function tick(s, dtReal, rand = Math.random) {
  const dt = dtReal * SPEED;
  const beat = currentBeat(s.gameSeconds);
  const drainMult = s.gameSeconds < s.calmUntil ? 1 : beat.drainMult;
  const n = { ...s };
  n.gameSeconds = s.gameSeconds + dt;
  if (n.cameraOn) {
    n.focus = clamp(n.focus - RATES.focusDrainOn * drainMult * dt, 0, 100);
    n.visibility = clamp(n.visibility - RATES.visDriftOn * dt, 0, 100);
  } else {
    n.focus = clamp(n.focus + RATES.focusRegenOff * dt, 0, 100);
    n.visibility = clamp(n.visibility - RATES.visDecayOff * dt, 0, 100);
  }
  if (n.gameSeconds >= n.nextLineAt) emitLine(n, rand);
  if (n.prompt && n.gameSeconds >= n.prompt.expiresAt) expirePrompt(n);
  if (!n.prompt && n.gameSeconds >= 30) {
    if (n.gameSeconds >= n.nextNodAt) spawnNod(n, rand);
    else if (n.gameSeconds >= n.nextQuizAt) spawnQuiz(n, rand);
  }
  return n;
}

export const toggleCamera = (s) => ({ ...s, cameraOn: !s.cameraOn });

// ---------- PLAYER ACTIONS ----------

export function nod(s) {
  if (s.prompt?.type !== "nod") return s;
  const n = { ...s, prompt: null, stats: { ...s.stats, nods: s.stats.nods + 1 } };
  if (s.prompt.bait) {
    n.stats.badNods += 1;
    n.visibility = clamp(n.visibility + 14, 0, 100);
    n.focus = clamp(n.focus - 5, 0, 100);
    sys(n, "You nodded while Karen delivered bad news. HR has noted your enthusiasm.");
  } else {
    n.visibility = clamp(n.visibility + 4, 0, 100);
  }
  return n;
}

export function answerQuiz(s, idx) {
  if (s.prompt?.type !== "quiz") return s;
  const n = { ...s, prompt: null, stats: { ...s.stats } };
  if (s.focus <= 0) {
    n.flags = { ...n.flags, incoherent: true };
    n.stats.quizWrong += 1;
    n.stats.words += 5;
    n.visibility = clamp(n.visibility + 20, 0, 100);
    sys(n, '"Yes, totally, the synergies," you say. It was a yes/no question.');
    return n;
  }
  if (s.prompt.options[idx]?.correct) {
    n.stats.quizRight += 1;
    n.stats.words += 12;
    n.visibility = clamp(n.visibility + 6, 0, 100);
    sys(n, "Karen nods. 'Exactly.' A solid contribution. People noticed.");
  } else {
    n.stats.quizWrong += 1;
    n.stats.words += 10;
    n.visibility = clamp(n.visibility + 10, 0, 100);
    n.focus = clamp(n.focus - 8, 0, 100);
    sys(n, "Karen pauses. 'That's… not quite where we were.' Everyone saw.");
  }
  return n;
}

export function goodPoint(s) {
  if (s.prompt?.type !== "quiz" || onCooldown(s, "goodPoint")) return s;
  const n = { ...s, prompt: null, stats: { ...s.stats } };
  n.stats.quizMeh += 1;
  n.stats.words += 2;
  n.visibility = clamp(n.visibility + 2, 0, 100);
  n.cooldowns = { ...n.cooldowns, goodPoint: n.gameSeconds + COOLDOWNS.goodPoint };
  sys(n, "'Good point.' Nobody can prove it wasn't.");
  return n;
}

export function breakingUp(s) {
  if (s.prompt?.type !== "quiz" || s.breakingUpUses >= 2 || onCooldown(s, "breakingUp")) return s;
  const n = { ...s, stats: { ...s.stats } };
  n.breakingUpUses = s.breakingUpUses + 1;
  n.stats.words += 6;
  n.cooldowns = { ...n.cooldowns, breakingUp: n.gameSeconds + COOLDOWNS.breakingUp };
  n.prompt = { ...s.prompt, expiresAt: s.prompt.expiresAt + QUIZ_WINDOW };
  sys(n, "'You're breaking up, I missed that.' The point gets repeated, verbatim.");
  return n;
}

export function takeOffline(s) {
  if (onCooldown(s, "offline")) return s;
  const n = { ...s, stats: { ...s.stats } };
  n.meetingEnd = Math.max(n.gameSeconds + 60, n.meetingEnd - 180);
  n.calmUntil = n.gameSeconds + 60;
  n.visibility = clamp(n.visibility + 12, 0, 100);
  n.stats.words += 4;
  n.cooldowns = { ...n.cooldowns, offline: n.gameSeconds + COOLDOWNS.offline };
  sys(n, "'Let's take this offline.' The tangent dies instantly. Everyone saw you kill it.");
  return n;
}

export function hardStop(s) {
  if (s.hardStopUsed) return s;
  const n = { ...s, stats: { ...s.stats } };
  n.hardStopUsed = true;
  n.meetingEnd = Math.min(n.meetingEnd, SCHEDULED_END);
  n.visibility = clamp(n.visibility + 18, 0, 100);
  n.stats.words += 7;
  sys(n, "'I have a hard stop at :30.' Noted. Everyone now knows you have somewhere better to be.");
  return n;
}
