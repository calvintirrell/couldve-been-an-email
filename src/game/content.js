// ---------- CAST ----------

export const CAST = {
  boss: { name: "Karen", role: "The Boss", emoji: "👩‍💼", color: "#E8590C" },
  rambler: { name: "Dave", role: "The Rambler", emoji: "🧔", color: "#1C7ED6" },
  brad: { name: "Brad", role: "Circle-Back", emoji: "🕴️", color: "#12B886" },
  diane: { name: "Diane", role: "One-More-Thing", emoji: "👩‍🦰", color: "#BE4BDB" },
  mute: { name: "Stan", role: "Mute Guy", emoji: "🎧", color: "#868E96" },
  greg: { name: "Greg", role: "Also Here", emoji: "🧑‍💻", color: "#F59F00" },
};

// ---------- MEETING STRUCTURE ----------
// Beats partition the meeting by game-time (seconds). Weights drive who talks;
// drainMult scales Focus drain (the Rambler is exhausting by design).

export const BEATS = [
  { start: 0, label: "kickoff", weights: { boss: 5, greg: 2, brad: 2, mute: 1 }, drainMult: 1 },
  { start: 120, label: "status updates", weights: { greg: 4, brad: 3, boss: 2, mute: 1 }, drainMult: 1 },
  { start: 480, label: "dave has context", weights: { rambler: 7, boss: 1, brad: 1 }, drainMult: 1.6 },
  { start: 780, label: "alignment", weights: { brad: 5, boss: 3, greg: 2, mute: 1 }, drainMult: 1 },
  { start: 1140, label: "dave has more context", weights: { rambler: 6, boss: 2, diane: 1 }, drainMult: 1.6 },
  { start: 1440, label: "attempted wrap-up", weights: { boss: 4, diane: 3, brad: 2, greg: 2 }, drainMult: 1 },
  { start: 1800, label: "overtime", weights: { diane: 4, boss: 3, rambler: 2, brad: 2 }, drainMult: 1.3 },
];

// Scripted lines that anchor each beat, emitted in order once their time comes.
export const ANCHORS = [
  { at: 0, speaker: "boss", text: "Alright, I see enough faces. Let's get started — this should be a quick one." },
  { at: 120, speaker: "boss", text: "Okay, let's go around for status updates. Keep it tight, people." },
  { at: 480, speaker: "rambler", text: "Before we move on — and I promise this is relevant — let me give some context." },
  { at: 780, speaker: "brad", text: "I think what we're all dancing around is: are we aligned on the alignment?" },
  { at: 1140, speaker: "rambler", text: "Actually, this connects back to what I was saying earlier. Picture Q1." },
  { at: 1440, speaker: "boss", text: "Okay, we're coming up on time, so let's start to wrap." },
  { at: 1800, speaker: "diane", text: "Sorry — quick thing before everyone drops." },
];

// ---------- FILLER DECKS ----------

export const FILLER = {
  boss: [
    "Let's make sure we're all rowing in the same direction on this.",
    "I want to be conscious of everyone's time here.",
    "Great point. Let's put a pin in that.",
    "The leadership team is very excited about this initiative.",
    "Can everyone see my screen? …No? Okay, one second.",
    "Let's take a step back and look at the bigger picture.",
    "I'll keep this brief.",
    "We need to be more strategic about how we're being strategic.",
  ],
  rambler: [
    "So — and this is kind of a tangent, but I think it's important —",
    "This actually reminds me of something we tried in 2019. Let me set the context.",
    "There are really three parts to this. Well, four. Let me start with the fifth.",
    "I'll be quick. So, backstory:",
    "…and that's why the vendor situation is complicated. Anyway, where was I?",
    "Just to add color to what was already said, and then some color to that color —",
    "Okay, so picture this. It's Q1. The dashboard is red.",
    "Not to go down a rabbit hole here, but — actually, quick rabbit hole.",
  ],
  brad: [
    "Let's circle back on that offline.",
    "We should double-click on that.",
    "Just want to make sure we're aligned on the alignment.",
    "Can we level-set on the framework before we framework the levels?",
    "I think there's a real synergy opportunity here.",
    "Let's not boil the ocean on this one.",
    "We can take that as a parking-lot item.",
    "Net-net, I think we're saying the same thing.",
  ],
  diane: [
    "Sorry, quick thing before we drop —",
    "This will only take a second.",
    "While I have everyone here —",
    "One tiny thing on the calendar invite itself.",
    "Oh — and one more thing. Small one.",
    "Before I forget, and I know we're at time —",
  ],
  greg: [
    "No updates from my side.",
    "I'll drop the link in the chat.",
    "Can everyone hear me okay?",
    "+1 to what Brad said.",
    "I have a hard stop but I can stay a few minutes.",
    "Sorry, I was on mute. As I was saying: no updates.",
    "I can take a first pass at that. Wait, no. Withdrawn.",
  ],
  mute: [
    "(lips moving, no audio)",
    "(gesturing at a spreadsheet nobody can see)",
    "(passionately muted)",
    "(nodding while muted, pointing at something off-screen)",
  ],
};

// Bad news delivered right as a nod prompt appears. Nodding here is a disaster.
export const BAD_NEWS = [
  "Quick heads up: we're doing a small reorg. Nothing to worry about.",
  "Unfortunately, we did not hit the Q2 targets.",
  "We've decided to sunset the project some of you have been working on.",
  "Budget freeze effective immediately. Travel, tools, snacks — all of it.",
  "We're saying goodbye to a few colleagues today. They were great.",
];

// Plausible-but-wrong called-on answers (the right one echoes the transcript).
export const WRONG_ANSWERS = [
  "Yes — this ties back to the hiring freeze discussion.",
  "I think the real issue is the vendor contract.",
  "We should loop in legal before committing to that.",
  "Honestly, the roadmap answers this for us.",
  "Strong +1 to the budget realignment point.",
  "I'd push back gently — the Q2 numbers say otherwise.",
];

// What your options look like when you weren't reading the transcript.
export const GARBLED_OPTIONS = [
  "…yes, totally, the synergies?",
  "…the dashboard… thing?",
  "strong agree with… what was said",
  "…circle back? to it?",
  "…numbers. the numbers one",
];

// What the transcript degrades into when Focus hits zero.
export const GARBLE = [
  "something something Q3 something synergy",
  "…numbers? or dashboards. hard to say",
  "something about the deck, probably",
  "synergy synergy synergy roadmap synergy",
  "…did someone say your name? no. probably not",
  "words are happening. you are somewhere else",
];
