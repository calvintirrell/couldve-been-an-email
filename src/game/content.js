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
    "Our North Star hasn't changed. The metrics around it have.",
    "I saw a LinkedIn post about this exact thing this morning.",
    "Remember: we're a family. A family with OKRs.",
    "Whose calendar do we need to steal time from to fix this?",
    "This is a great conversation. Let's schedule a follow-up to continue it.",
    "I'm going to play devil's advocate against my own idea here.",
    "We don't need consensus. We need alignment. They're different.",
    "Quick housekeeping: this meeting is now weekly.",
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
    "Let me paint the full picture. Canvas first. Actually, easel.",
    "The short version — and I'm compressing a LOT here —",
    "This is basically the 2021 situation all over again. Who remembers 2021?",
    "Hold that thought, because it connects to four other thoughts.",
    "I made a diagram about this. It's not in the deck, but imagine it.",
    "So the vendor called me. Well, emailed. Well, their assistant emailed.",
    "Third bullet, sub-point B — actually, let me start with the appendix.",
    "One caveat. Two caveats. Okay, a caveat framework.",
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
    "Big fan of this direction. Directionally.",
    "Can we get a strawman? Or at least a strawperson?",
    "This is low-hanging fruit we can action pre-Q4.",
    "Let's socialize this internally before we externalize it.",
    "I want to plus-one that, and then plus-two the plus-one.",
    "We're 90% aligned. The remaining 10% is the whole disagreement.",
    "Is there a dashboard for this? There should be a dashboard.",
    "Let's move fast on this. Deliberately fast. Slow, even.",
  ],
  diane: [
    "Sorry, quick thing before we drop —",
    "This will only take a second.",
    "While I have everyone here —",
    "One tiny thing on the calendar invite itself.",
    "Oh — and one more thing. Small one.",
    "Before I forget, and I know we're at time —",
    "Tiny flag — nothing blocking — well, slightly blocking.",
    "I put a comment in the doc. It's more of an essay.",
    "Related-ish: whose plant is that in the background? It's dying.",
    "I'll be super quick because I know we're at time. Preamble first:",
    "Two-second thing. The kitchen fridge situation has escalated.",
    "Also the invite said 30 minutes and I just think that's funny.",
  ],
  greg: [
    "No updates from my side.",
    "I'll drop the link in the chat.",
    "Can everyone hear me okay?",
    "+1 to what Brad said.",
    "I have a hard stop but I can stay a few minutes.",
    "Sorry, I was on mute. As I was saying: no updates.",
    "I can take a first pass at that. Wait, no. Withdrawn.",
    "Still no updates. Consistency is a kind of update.",
    "I can neither confirm nor deny progress on my end.",
    "My update is blocked by the thing I mentioned last week.",
    "Echoing what everyone said, in the same order they said it.",
    "You're on mute— no, wait, that's me. I was on mute.",
    "Happy to sync offline about maybe syncing online later.",
    "I have another call in— oh. Oh no. I have another call.",
  ],
  mute: [
    "(lips moving, no audio)",
    "(gesturing at a spreadsheet nobody can see)",
    "(passionately muted)",
    "(nodding while muted, pointing at something off-screen)",
    "(holding up a document to the camera, backwards)",
    "(typing loudly, muted, occasionally laughing)",
    "(mouthing 'can you hear me?' — no one can)",
    "(unmutes, breathes in, mutes again)",
  ],
};

// Bad news delivered right as a nod prompt appears. Nodding here is a disaster.
export const BAD_NEWS = [
  "Quick heads up: we're doing a small reorg. Nothing to worry about.",
  "Unfortunately, we did not hit the Q2 targets.",
  "We've decided to sunset the project some of you have been working on.",
  "Budget freeze effective immediately. Travel, tools, snacks — all of it.",
  "We're saying goodbye to a few colleagues today. They were great.",
  "The offsite is cancelled. The team-building budget is now a memory.",
  "Legal has asked us to pause the thing everyone loves.",
  "We're 'realigning priorities,' which is a sentence with a body count.",
  "The client went with the other vendor. The cheaper, worse one.",
  "Annual reviews are moving up a quarter. Surprise.",
];

// Plausible-but-wrong called-on answers (the right one echoes the transcript).
export const WRONG_ANSWERS = [
  "Yes — this ties back to the hiring freeze discussion.",
  "I think the real issue is the vendor contract.",
  "We should loop in legal before committing to that.",
  "Honestly, the roadmap answers this for us.",
  "Strong +1 to the budget realignment point.",
  "I'd push back gently — the Q2 numbers say otherwise.",
  "This is why we need to revisit the pricing model.",
  "Classic scope creep — we should freeze the requirements.",
  "I'd defer to whatever marketing thinks here.",
  "Can we A/B test it? Everything is A/B-testable.",
  "That's a people problem, not a process problem.",
  "Honestly? The offsite will fix this.",
];

// What your options look like when you weren't reading the transcript.
export const GARBLED_OPTIONS = [
  "…yes, totally, the synergies?",
  "…the dashboard… thing?",
  "strong agree with… what was said",
  "…circle back? to it?",
  "…numbers. the numbers one",
  "…the Q3… of it all?",
  "what Brad said. verbatim. again",
  "…a strong maybe?",
  "the… initiative? initiatives?",
  "…per my last… thought?",
];

// "Quick question" — adds 4 minutes, always.
export const QUICK_QUESTIONS = [
  "Sorry — quick question before we move on. It's about the logo.",
  "Wait, quick question: does this affect the offsite?",
  "Quick question, might be a dumb one — what's our actual goal here?",
  "Super quick question. Well, two questions. Maybe three.",
  "Quick question — is this in scope, and also, what is the scope?",
  "One quick clarifying question with seven parts.",
  "Quick question about the font in the deck. Slide one. All slides.",
  "Quick q: are we allowed to say no to the client? Asking for me.",
];

// Diane's signature move — lands as people are saying goodbye. +6 minutes.
export const ONE_MORE_THINGS = [
  "Oh — one more thing before everyone drops. Small one.",
  "Sorry, this will take literally one second. So. Three things:",
  "Wait wait wait — before we go. It's about the shared drive.",
  "Before everyone leaves — the parking situation. It's about the parking.",
  "One more thing and it's genuinely tiny: we need to rename everything.",
  "Last thing, I promise. What's our position on the office thermostat?",
];

// The boss opens a hot potato standoff.
export const HOT_POTATO_OPENERS = [
  "So — we need someone to own this.",
  "This feels like it needs a single owner. Any volunteers?",
  "Someone should take this offline and drive it. Who wants it?",
  "Great discussion. Now — who's driving this?",
  "I don't want this to fall through the cracks. Someone grab it.",
  "Let's assign a DRI before we forget. Don't everyone speak at once.",
];

// What the transcript degrades into when Focus hits zero.
export const GARBLE = [
  "something something Q3 something synergy",
  "…numbers? or dashboards. hard to say",
  "something about the deck, probably",
  "synergy synergy synergy roadmap synergy",
  "…did someone say your name? no. probably not",
  "words are happening. you are somewhere else",
  "…dashboard dashboard something deliverable…",
  "someone is very excited about a spreadsheet",
  "a chart appeared. it went up, or possibly down",
  "…the roadmap? the roadmap. definitely the roadmap",
  "your name??? no. false alarm. probably",
  "meeting sounds. corporate ambience. void",
];
