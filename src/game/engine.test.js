import { describe, it, expect } from "vitest";
import {
  createGame,
  tick,
  toggleCamera,
  fmtClock,
  visibilityZone,
  currentBeat,
  SPEED,
  MAX_TRANSCRIPT,
} from "./engine.js";
import { ANCHORS, GARBLE, CAST } from "./content.js";

const r05 = () => 0.5;

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
    for (const l of s.transcript) expect(Object.keys(CAST)).toContain(l.speakerId);
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
