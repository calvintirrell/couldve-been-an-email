import {
  BEATS,
  ANCHORS,
  FILLER,
  GARBLE,
  BAD_NEWS,
  WRONG_ANSWERS,
  GARBLED_OPTIONS,
  QUICK_QUESTIONS,
  ONE_MORE_THINGS,
  HOT_POTATO_OPENERS,
  CAST,
} from "./content.js";

export const SPEED = 7; // game-seconds per real second (~30-min meeting ≈ 4.5 real minutes)
export const SCHEDULED_END = 30 * 60; // game-seconds
export const MAX_TRANSCRIPT = 60;
export const NOD_WINDOW = 24.5; // 3.5 real seconds
export const QUIZ_WINDOW = 42; // 6 real seconds
export const BAIT_CHANCE = 0.2;
export const TENSION_FILL = 100 / 56; // standoff tension per game-second (~8 real seconds)

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
    ending: null, // {id: 'perfect'|'survived'|'overloaded'|'exposed'|'incoherent'}
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
    prompt: null, // {type:'nod'|'quiz'|'standoff', ...}
    nextNodAt: 60,
    nextQuizAt: 240,
    nextExtensionAt: 330,
    nextStandoffAt: 420,
    quickQuestions: 0,
    dianeStrikes: 0,
    resentment: {}, // coworkerId -> level; they remember deflections
    muteAssigned: false,
    offStreak: 0, // consecutive game-seconds with camera off
    lastExtension: null, // {amount, at, by} — drives the +4:00 flash
    cooldowns: {},
    breakingUpUses: 0,
    hardStopUsed: false,
    calmUntil: 0, // "take this offline" suppresses tangent drain until here
    flags: {}, // incoherent, etc — endings wired in Phase 5
    stats: {
      nods: 0,
      badNods: 0,
      words: 0,
      quizRight: 0,
      quizWrong: 0,
      quizMeh: 0,
      minutesAdded: 0,
      itemsDodged: 0,
      volunteered: 0,
      deflections: 0,
      extensionsBlocked: 0,
    },
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
  let emittedAnchor = false;
  if (anchor && s.gameSeconds >= anchor.at) {
    speakerId = anchor.speaker;
    text = anchor.text;
    s.anchorIdx += 1;
    emittedAnchor = true;
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
  // Dave giving "context" (a scripted anchor) quietly costs everyone two minutes
  if (emittedAnchor && speakerId === "rambler") extend(s, 120, "rambler");
}

// ---------- THE CLOCK IS A LIAR ----------

function extend(s, amount, by) {
  if (s.hardStopUsed) {
    s.stats.extensionsBlocked += 1;
    sys(s, `${CAST[by].name} starts to add time. You have a hard stop. The time is not added.`);
    return;
  }
  s.meetingEnd += amount;
  s.stats.minutesAdded += amount / 60;
  s.lastExtension = { amount, at: s.gameSeconds, by };
}

function maybeExtend(s, rand) {
  // Diane strikes exclusively as the meeting is about to end
  if (s.dianeStrikes < 2 && s.gameSeconds > 900 && s.meetingEnd - s.gameSeconds < 50) {
    s.dianeStrikes += 1;
    pushLine(s, { speakerId: "diane", text: pick(ONE_MORE_THINGS, rand), muted: false, garbled: false });
    extend(s, 360, "diane");
    return;
  }
  if (
    s.quickQuestions < 2 &&
    s.gameSeconds >= s.nextExtensionAt &&
    s.gameSeconds < s.meetingEnd - 120
  ) {
    s.quickQuestions += 1;
    const by = pick(["greg", "brad", "rambler"], rand);
    pushLine(s, { speakerId: by, text: pick(QUICK_QUESTIONS, rand), muted: false, garbled: s.focus <= 0 });
    extend(s, 240, by);
    s.nextExtensionAt = s.gameSeconds + 380 + rand() * 220;
  }
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

function makeQuizOptions(s, rand) {
  const source = findQuizSource(s);
  if (!source) return null;
  const garbled = source.garbled || s.focus <= 0;
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
  return { options, garbled };
}

function spawnQuiz(s, rand) {
  const built = makeQuizOptions(s, rand);
  if (!built) return;
  pushLine(s, { speakerId: "boss", text: "I'd love your take here. Thoughts?", muted: false, garbled: false });
  s.prompt = { type: "quiz", ...built, expiresAt: s.gameSeconds + QUIZ_WINDOW };
  s.nextQuizAt = s.gameSeconds + 200 + rand() * 120;
}

// Visibility bottomed out: the boss noticed you've said nothing. Instant hard quiz — fail and you're done.
function spawnRecap(s, rand) {
  const built = makeQuizOptions(s, rand);
  if (!built) return;
  pushLine(s, {
    speakerId: "boss",
    text: "Sorry — I want to make sure everyone's engaged. Can you recap what we just discussed?",
    muted: false,
    garbled: false,
  });
  s.prompt = { type: "quiz", recap: true, ...built, expiresAt: s.gameSeconds + QUIZ_WINDOW };
}

function expirePrompt(s) {
  const p = s.prompt;
  s.prompt = null;
  if (p.type !== "quiz") return;
  if (p.recap) {
    sys(s, "You blinked. Everyone watched you buffer.");
    s.ending = { id: "exposed" };
    return;
  }
  s.visibility = clamp(s.visibility - 9, 0, 100);
  sys(s, "You froze. The silence developed a personality.");
}

// ---------- HOT POTATO ----------

const STANDOFF_POOL = ["brad", "greg", "rambler", "diane"];

function spawnStandoff(s, rand) {
  pushLine(s, { speakerId: "boss", text: pick(HOT_POTATO_OPENERS, rand), muted: false, garbled: false });
  const pool = [...STANDOFF_POOL];
  const count = 2 + (rand() < 0.5 ? 1 : 0);
  const participants = [];
  for (let i = 0; i < count; i++) {
    participants.push(pool.splice(Math.floor(rand() * pool.length) % pool.length, 1)[0]);
  }
  const coworkerPulls = {};
  for (const id of participants) coworkerPulls[id] = 25 + rand() * 40;
  s.prompt = {
    type: "standoff",
    participants,
    coworkerPulls,
    yourPull: s.visibility + (s.hardStopUsed ? 10 : 0), // hard stop: "you'll own the deck, right?"
    tension: 0,
    coughUsed: false,
    deflectedBack: [],
  };
  s.nextStandoffAt = s.gameSeconds + 500 + rand() * 220;
}

function assignToYou(s) {
  s.actionItems += 1;
  s.prompt = null;
  sys(s, "'Great — you'll own it,' Karen says. It's in the notes. It's official.");
}

function coworkerTakesIt(s, id, crackLine) {
  s.stats.itemsDodged += 1;
  s.prompt = null;
  sys(s, crackLine);
}

function tickStandoff(s, dt, rand) {
  const p = { ...s.prompt, deflectedBack: [...s.prompt.deflectedBack], coworkerPulls: { ...s.prompt.coworkerPulls } };
  s.prompt = p;
  p.tension = Math.min(100, p.tension + TENSION_FILL * dt);
  for (const id of p.participants) {
    const resent = s.resentment[id] || 0;
    if (resent > 0) {
      // resentful coworkers don't crack — they deflect back at you
      if (!p.deflectedBack.includes(id) && rand() < 0.004 * dt) {
        p.deflectedBack.push(id);
        p.yourPull += 15;
        sys(s, `${CAST[id].name}: "I feel like this is really your wheelhouse." They remember.`);
      }
    } else if (rand() < 0.0025 * dt) {
      coworkerTakesIt(s, id, `${CAST[id].name} breaks. "…I can take a first pass." They look dead inside.`);
      return;
    }
  }
  if (s.prompt && p.tension >= 100) {
    const maxCoworker = Math.max(...p.participants.map((id) => p.coworkerPulls[id]));
    if (p.yourPull >= maxCoworker) {
      assignToYou(s);
      sys(s, "Nobody cracked. Karen picked the most visible person. That was you.");
    } else {
      const victim = p.participants.find((id) => p.coworkerPulls[id] === maxCoworker);
      coworkerTakesIt(s, victim, `"${CAST[victim].name}, you've been really engaged — you own it," Karen says.`);
    }
  }
}

// One horrifying event: assigned an action item while your camera is off.
function maybeMuteAssign(s, dt, rand) {
  if (s.muteAssigned || s.cameraOn || s.offStreak < 90 || s.gameSeconds < 600) return;
  if (rand() < 0.0012 * dt) {
    s.muteAssigned = true;
    s.actionItems += 1;
    pushLine(s, {
      speakerId: "boss",
      text: "…and let's have you own the follow-ups. Perfect, thanks for volunteering. Moving on.",
      muted: false,
      garbled: false,
    });
    sys(s, "You were assigned an action item while your camera was off. You couldn't even object.");
  }
}

// ---------- TICK ----------

const withEnding = (s, id) => ({ ...s, ending: { id }, prompt: null });

export function tick(s, dtReal, rand = Math.random) {
  if (s.ending) return s;
  const dt = dtReal * SPEED;
  const beat = currentBeat(s.gameSeconds);
  const drainMult = s.gameSeconds < s.calmUntil ? 1 : beat.drainMult;
  const n = { ...s };
  n.gameSeconds = s.gameSeconds + dt;
  if (n.cameraOn) {
    n.focus = clamp(n.focus - RATES.focusDrainOn * drainMult * dt, 0, 100);
    n.visibility = clamp(n.visibility - RATES.visDriftOn * dt, 0, 100);
    n.offStreak = 0;
  } else {
    n.focus = clamp(n.focus + RATES.focusRegenOff * dt, 0, 100);
    n.visibility = clamp(n.visibility - RATES.visDecayOff * dt, 0, 100);
    n.offStreak = s.offStreak + dt;
  }
  n.stats = { ...n.stats };
  if (n.gameSeconds >= n.nextLineAt) emitLine(n, rand);
  maybeExtend(n, rand);
  maybeMuteAssign(n, dt, rand);
  if (n.prompt?.type === "standoff") tickStandoff(n, dt, rand);
  if (n.prompt && n.gameSeconds >= n.prompt.expiresAt) expirePrompt(n);
  if (n.ending) return n;
  if (n.actionItems >= 3) return withEnding(n, "overloaded");
  if (n.visibility <= 0 && !n.prompt?.recap) spawnRecap(n, rand);
  if (!n.prompt && n.gameSeconds >= 30) {
    if (n.gameSeconds >= n.nextNodAt) spawnNod(n, rand);
    else if (n.gameSeconds >= n.nextQuizAt) spawnQuiz(n, rand);
    else if (n.gameSeconds >= n.nextStandoffAt && n.gameSeconds >= 300) spawnStandoff(n, rand);
  }
  if (n.gameSeconds >= n.meetingEnd) {
    const perfect = n.actionItems === 0 && visibilityZone(n.visibility) === "mid";
    return withEnding(n, perfect ? "perfect" : "survived");
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
    sys(n, '"Yes, totally, the synergies," you say. It was a yes/no question.');
    return withEnding(n, "incoherent");
  }
  if (s.prompt.options[idx]?.correct) {
    n.stats.quizRight += 1;
    n.stats.words += 12;
    if (s.prompt.recap) {
      n.visibility = 20;
      sys(n, "You recap it. Barely. Karen moves on. That was too close.");
    } else {
      n.visibility = clamp(n.visibility + 6, 0, 100);
      sys(n, "Karen nods. 'Exactly.' A solid contribution. People noticed.");
    }
  } else {
    n.stats.quizWrong += 1;
    n.stats.words += 10;
    if (s.prompt.recap) {
      sys(n, "That was not what was discussed. Karen's smile does not reach her eyes.");
      return withEnding(n, "exposed");
    }
    n.visibility = clamp(n.visibility + 10, 0, 100);
    n.focus = clamp(n.focus - 8, 0, 100);
    sys(n, "Karen pauses. 'That's… not quite where we were.' Everyone saw.");
  }
  return n;
}

export function goodPoint(s) {
  if (s.prompt?.type !== "quiz" || s.prompt.recap || onCooldown(s, "goodPoint")) return s;
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

// ---------- STANDOFF ACTIONS ----------

export function fakeCough(s) {
  if (s.prompt?.type !== "standoff" || s.prompt.coughUsed) return s;
  const n = { ...s, prompt: { ...s.prompt } };
  n.prompt.coughUsed = true;
  n.prompt.yourPull -= 12;
  sys(n, "You cough. Convincingly ill. Ownership feels like less of a fit for you now.");
  return n;
}

export function deflect(s, targetId, rand = Math.random) {
  if (s.prompt?.type !== "standoff" || !s.prompt.participants.includes(targetId)) return s;
  const n = { ...s, stats: { ...s.stats }, resentment: { ...s.resentment }, prompt: { ...s.prompt } };
  const priorResentment = n.resentment[targetId] || 0;
  n.resentment[targetId] = priorResentment + 1;
  n.stats.deflections += 1;
  n.stats.words += 8;
  if (rand() < 0.7 - priorResentment * 0.2) {
    n.stats.itemsDodged += 1;
    n.prompt = null;
    sys(n, `"${CAST[targetId].name} is really close to this one," you say. They sigh. "…Sure. I'll take it." They will remember this.`);
  } else {
    n.prompt.yourPull += 18;
    n.prompt.tension = Math.min(100, n.prompt.tension + 20);
    sys(n, `"Actually, I think that's more your area," ${CAST[targetId].name} says, instantly. Everyone nods.`);
  }
  return n;
}

export function volunteer(s) {
  if (s.prompt?.type !== "standoff") return s;
  const n = { ...s, stats: { ...s.stats }, prompt: null };
  n.actionItems += 1;
  n.stats.volunteered += 1;
  n.stats.words += 3;
  n.visibility = 50; // the big cushion: comfortably mid for a while
  sys(n, "'I'll own it.' Karen beams. You are, briefly, beyond reproach.");
  return n;
}

// ---------- ENDINGS ----------

export function gradeRun(s) {
  let score = 100 - s.actionItems * 25 - s.stats.badNods * 8 - s.stats.quizWrong * 10;
  if (visibilityZone(s.visibility) !== "mid") score -= 15;
  if (s.stats.words > 40) score -= 10;
  return score >= 85 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : "D";
}

export function describeEnding(s) {
  const mins = Math.max(1, Math.round(s.gameSeconds / 60));
  const words = s.stats.words;
  const items = s.actionItems;
  return {
    perfect: {
      won: true,
      title: "Leadership Material",
      blurb: `You said ${words} words in ${mins} minutes. Zero action items. Optimal visibility. Nobody knows what you do, and nobody ever will.`,
    },
    survived: {
      won: true,
      title: "You Survived the Sync",
      blurb: `${mins} minutes. ${items} action item${items === 1 ? "" : "s"} followed you out. Performance grade: ${gradeRun(s)}. There is another occurrence next week.`,
    },
    overloaded: {
      won: false,
      title: "You Now Own the Q3 Roadmap",
      blurb: "Third action item. Congratulations: you own the roadmap, the deck, and the follow-ups. The meeting ended. Your suffering did not.",
    },
    exposed: {
      won: false,
      title: "Caught Completely Lurking",
      blurb: `"Can you recap what we just discussed?" You could not. Everyone watched. The silence is now load-bearing. There will be a follow-up meeting about engagement.`,
    },
    incoherent: {
      won: false,
      title: "Yes, Totally, The Synergies",
      blurb: "You unmuted and said it in response to a yes/no question. The meeting paused. Someone screenshotted it. It's already in three group chats.",
    },
  }[s.ending.id];
}

// The title payoff: the whole meeting, two sentences.
export function buildEmail(s) {
  const mins = Math.max(1, Math.round(s.gameSeconds / 60));
  const items = s.actionItems;
  const s1 =
    "Good sync today — we aligned on Q3 priorities, Dave added valuable context, and Brad surfaced a synergy opportunity we'll double-click on next week.";
  const s2 =
    items > 0
      ? `Action items are in the notes (${items} of them ${items === 1 ? "has" : "have"} your name on ${items === 1 ? "it" : "them"}); we'll pick this up at next week's occurrence.`
      : "Action items have been distributed (none to you, somehow); we'll pick this up at next week's occurrence.";
  return {
    subject: "Recap: Q3 Alignment Sync",
    body: `${s1} ${s2}`,
    footer: `This email took 40 seconds to read. The meeting took ${mins} minutes.`,
  };
}
