import { describe, it, expect } from "vitest";
import {
  createGame,
  tick,
  toggleCamera,
  nod,
  answerQuiz,
  goodPoint,
  breakingUp,
  takeOffline,
  hardStop,
  onCooldown,
  fmtClock,
  visibilityZone,
  currentBeat,
  SPEED,
  MAX_TRANSCRIPT,
  SCHEDULED_END,
} from "./engine.js";
import { ANCHORS, GARBLE, CAST } from "./content.js";

const r05 = () => 0.5;

// a known transcript line to react to
const line = (over = {}) => ({
  id: 1,
  at: 95,
  speakerId: "brad",
  text: "Let's not boil the ocean on this one.",
  muted: false,
  garbled: false,
  ...over,
});

// crafted states with schedulers parked so only the thing under test fires
const preNod = (bait) => ({
  ...createGame(),
  gameSeconds: 100,
  prompt: { type: "nod", bait, speakerId: "brad", expiresAt: 120 },
  transcript: [line()],
  nextNodAt: 1e9,
  nextQuizAt: 1e9,
  nextLineAt: 1e9,
});

const preQuiz = (over = {}) => ({
  ...createGame(),
  gameSeconds: 100,
  transcript: [line()],
  nextQuizAt: 0,
  nextNodAt: 1e9,
  nextLineAt: 1e9,
  ...over,
});

describe("fmtClock", () => {
  it("formats game-seconds as M:SS", () => {
    expect(fmtClock(0)).toBe("0:00");
    expect(fmtClock(70)).toBe("1:10");
    expect(fmtClock(605)).toBe("10:05");
    expect(fmtClock(1830)).toBe("30:30");
  });
});

describe("visibilityZone", () => {
  it("splits into Goldilocks zones", () => {
    expect(visibilityZone(0)).toBe("low");
    expect(visibilityZone(17)).toBe("low");
    expect(visibilityZone(18)).toBe("mid");
    expect(visibilityZone(50)).toBe("mid");
    expect(visibilityZone(72)).toBe("mid");
    expect(visibilityZone(73)).toBe("high");
    expect(visibilityZone(100)).toBe("high");
  });
});

describe("beats", () => {
  it("finds the beat for a given time", () => {
    expect(currentBeat(0).label).toBe("kickoff");
    expect(currentBeat(500).label).toBe("dave has context");
    expect(currentBeat(2500).label).toBe("overtime");
  });

  it("rambler beats drain focus harder", () => {
    const kickoff = tick(createGame(), 1, r05);
    const rambling = tick({ ...createGame(), gameSeconds: 500 }, 1, r05);
    expect(rambling.focus).toBeLessThan(kickoff.focus);
  });
});

describe("tick", () => {
  it("advances game time at 7x real time", () => {
    const n = tick(createGame(), 1, r05);
    expect(n.gameSeconds).toBe(SPEED);
  });

  it("camera on: focus drains, visibility drifts down slowly", () => {
    const n = tick(createGame(), 1, r05);
    expect(n.focus).toBeCloseTo(99.51, 2);
    expect(n.visibility).toBeCloseTo(49.916, 2);
  });

  it("camera off: focus regenerates, visibility tanks", () => {
    const n = tick({ ...createGame(), cameraOn: false, focus: 50 }, 1, r05);
    expect(n.focus).toBeCloseTo(51.05, 2);
    expect(n.visibility).toBeCloseTo(49.23, 2);
  });

  it("clamps focus at zero", () => {
    const n = tick({ ...createGame(), focus: 0.1 }, 1, r05);
    expect(n.focus).toBe(0);
  });

  it("toggleCamera flips the camera", () => {
    expect(toggleCamera(createGame()).cameraOn).toBe(false);
  });
});

describe("transcript engine", () => {
  it("opens the meeting with the boss's scripted line", () => {
    const n = tick(createGame(), 1, r05);
    expect(n.transcript).toHaveLength(1);
    expect(n.transcript[0].speakerId).toBe("boss");
    expect(n.transcript[0].text).toBe(ANCHORS[0].text);
  });

  it("emits scripted anchors in order among the filler, from valid speakers", () => {
    let s = createGame();
    for (let i = 0; i < 80; i++) s = tick(s, 1, r05); // 560 game-seconds
    const texts = s.transcript.map((l) => l.text);
    expect(texts).toContain(ANCHORS[1].text); // status updates (t=120)
    expect(texts).toContain(ANCHORS[2].text); // rambler context (t=480)
    for (const l of s.transcript) expect([...Object.keys(CAST), "sys"]).toContain(l.speakerId);
    expect(s.transcript.length).toBeGreaterThan(20);
  });

  it("caps the kept transcript", () => {
    let s = createGame();
    for (let i = 0; i < 300; i++) s = tick(s, 1, r05);
    expect(s.transcript.length).toBeLessThanOrEqual(MAX_TRANSCRIPT);
  });

  it("garbles lines when focus is zero", () => {
    const n = tick({ ...createGame(), focus: 0 }, 1, r05);
    expect(n.transcript[0].garbled).toBe(true);
    expect(GARBLE).toContain(n.transcript[0].text);
  });

  it("mute guy talks on mute", () => {
    // skip anchors, force the weighted pick into the mute slot
    const s = { ...createGame(), anchorIdx: ANCHORS.length };
    const n = tick(s, 1, () => 0.95);
    expect(n.transcript[0].speakerId).toBe("mute");
    expect(n.transcript[0].muted).toBe(true);
  });
});

describe("nod QTEs", () => {
  it("spawns a nod prompt after the opening minute", () => {
    let s = createGame();
    for (let i = 0; i < 12 && s.prompt?.type !== "nod"; i++) s = tick(s, 1, r05);
    expect(s.prompt?.type).toBe("nod");
    expect(s.prompt.bait).toBe(false); // 0.5 ≥ 20% bait chance
    expect(Object.keys(CAST)).toContain(s.prompt.speakerId);
  });

  it("a well-timed nod maintains visibility", () => {
    const n = nod(preNod(false));
    expect(n.prompt).toBeNull();
    expect(n.visibility).toBe(54);
    expect(n.stats.nods).toBe(1);
  });

  it("nodding at bad news is a disaster", () => {
    const n = nod(preNod(true));
    expect(n.visibility).toBe(64);
    expect(n.focus).toBe(95);
    expect(n.stats.badNods).toBe(1);
    expect(n.transcript.some((l) => l.text.includes("HR has noted"))).toBe(true);
  });

  it("nodding with no prompt is a no-op; missed nods expire harmlessly", () => {
    const s = createGame();
    expect(nod(s)).toBe(s);
    const expired = tick(preNod(false), 4, r05); // 28gs later, past the window
    expect(expired.prompt).toBeNull();
    expect(expired.transcript.some((l) => l.text.includes("froze"))).toBe(false);
  });
});

describe("called-on quizzes", () => {
  it("the correct answer echoes the recent transcript", () => {
    const s = tick(preQuiz(), 0.1, r05);
    expect(s.prompt?.type).toBe("quiz");
    expect(s.prompt.garbled).toBe(false);
    expect(s.prompt.options).toHaveLength(3);
    expect(s.prompt.options.filter((o) => o.correct)).toHaveLength(1);
    expect(s.prompt.options.find((o) => o.correct).text).toContain("boil the ocean");
    expect(s.transcript.some((l) => l.text.includes("Thoughts?"))).toBe(true);
  });

  it("answering correctly is a solid contribution", () => {
    const s = tick(preQuiz(), 0.1, r05);
    const n = answerQuiz(s, s.prompt.options.findIndex((o) => o.correct));
    expect(n.prompt).toBeNull();
    expect(n.stats.quizRight).toBe(1);
    expect(n.visibility).toBeCloseTo(s.visibility + 6, 5);
  });

  it("answering wrong costs focus and draws attention", () => {
    const s = tick(preQuiz(), 0.1, r05);
    const n = answerQuiz(s, s.prompt.options.findIndex((o) => !o.correct));
    expect(n.stats.quizWrong).toBe(1);
    expect(n.visibility).toBeCloseTo(s.visibility + 10, 5);
    expect(n.focus).toBeCloseTo(s.focus - 8, 5);
  });

  it("zero focus means garbled options and an incoherent answer", () => {
    const s = tick(preQuiz({ focus: 0 }), 0.1, r05);
    expect(s.prompt.garbled).toBe(true);
    const n = answerQuiz(s, 0);
    expect(n.flags.incoherent).toBe(true);
    expect(n.transcript.some((l) => l.text.includes("synergies"))).toBe(true);
  });

  it("freezing (timeout) costs visibility", () => {
    let s = tick(preQuiz(), 0.1, r05);
    const vis = s.visibility;
    s = tick(s, 7, r05); // 49 game-seconds, past the 42gs window
    expect(s.prompt).toBeNull();
    expect(s.visibility).toBeLessThan(vis - 8);
    expect(s.transcript.some((l) => l.text.includes("froze"))).toBe(true);
  });

  it("'good point' resolves at a mediocre grade and goes on cooldown", () => {
    const s = tick(preQuiz(), 0.1, r05);
    const n = goodPoint(s);
    expect(n.prompt).toBeNull();
    expect(n.stats.quizMeh).toBe(1);
    expect(onCooldown(n, "goodPoint")).toBe(true);
    const again = { ...n, prompt: s.prompt };
    expect(goodPoint(again)).toBe(again);
  });

  it("'you're breaking up' buys time, at most twice per game", () => {
    const s = tick(preQuiz(), 0.1, r05);
    const n = breakingUp(s);
    expect(n.prompt.expiresAt).toBeCloseTo(s.prompt.expiresAt + 42, 5);
    expect(n.breakingUpUses).toBe(1);
    const spent = { ...n, breakingUpUses: 2 };
    expect(breakingUp(spent)).toBe(spent);
  });
});

describe("special moves", () => {
  it("'take this offline' claws back 3 minutes and goes on long cooldown", () => {
    const s = { ...createGame(), gameSeconds: 700 };
    const n = takeOffline(s);
    expect(n.meetingEnd).toBe(SCHEDULED_END - 180);
    expect(n.visibility).toBe(62);
    expect(onCooldown(n, "offline")).toBe(true);
    expect(takeOffline(n)).toBe(n);
  });

  it("hard stop caps the meeting at 30:00, once per game", () => {
    const s = { ...createGame(), meetingEnd: 2000 };
    const n = hardStop(s);
    expect(n.meetingEnd).toBe(SCHEDULED_END);
    expect(n.hardStopUsed).toBe(true);
    expect(n.visibility).toBe(68);
    expect(hardStop(n)).toBe(n);
  });
});
