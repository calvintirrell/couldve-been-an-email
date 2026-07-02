import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import App from "./App.jsx";
import { ANCHORS } from "./game/content.js";

afterEach(cleanup);

describe("title screen", () => {
  it("renders the title, premise, and rules", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Could've Been an Email" })).toBeInTheDocument();
    expect(screen.getByText("Q3 Alignment Sync")).toBeInTheDocument();
    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("Visibility")).toBeInTheDocument();
    expect(screen.getByText("3 action items")).toBeInTheDocument();
  });

  it("declining does not work", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(screen.getByRole("button", { name: "Nice try. Attendance is mandatory." })).toBeInTheDocument();
    // still on the title screen
    expect(screen.getByRole("heading", { name: "Could've Been an Email" })).toBeInTheDocument();
  });
});

describe("meeting shell", () => {
  const join = () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Accept · Join meeting" }));
  };

  it("joining shows the meeting shell with clock and waiting state", () => {
    join();
    expect(screen.getByText("Q3 Alignment Sync")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(screen.getByText(/30:00 scheduled/)).toBeInTheDocument();
    expect(screen.getByText("Waiting for the host to start the meeting…")).toBeInTheDocument();
  });

  it("shows the three resource meters at initial values", () => {
    join();
    expect(screen.getByText("Focus").nextSibling).toHaveTextContent("100");
    expect(screen.getByText("Visibility").nextSibling).toHaveTextContent("50");
    expect(screen.getByText("Action items").nextSibling).toHaveTextContent("0/3");
  });

  it("leaving the meeting returns to the invite", () => {
    join();
    fireEvent.click(screen.getByRole("button", { name: "Leave meeting" }));
    expect(screen.getByRole("heading", { name: "Could've Been an Email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
  });
});

describe("live meeting", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const join = () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Accept · Join meeting" }));
  };
  const tick = (ms) => act(() => vi.advanceTimersByTime(ms));
  const stat = (label) => Number(screen.getByText(label).nextSibling.textContent.replace("/3", ""));

  it("the host opens the meeting and the transcript flows", () => {
    join();
    tick(1000);
    expect(screen.getByText(ANCHORS[0].text)).toBeInTheDocument();
  });

  it("the clock counts up at 7x real time", () => {
    join();
    tick(10_000); // 10 real seconds → 70 game-seconds
    expect(screen.getByText("1:10")).toBeInTheDocument();
  });

  it("focus drains while paying attention", () => {
    join();
    tick(30_000);
    expect(stat("Focus")).toBeLessThan(100);
  });

  it("camera off regenerates focus and tanks visibility", () => {
    join();
    tick(60_000); // burn some focus first
    const focusBefore = stat("Focus");
    const visBefore = stat("Visibility");
    fireEvent.click(screen.getByRole("button", { name: /Turn camera off/ }));
    expect(screen.getByText("camera off")).toBeInTheDocument();
    tick(10_000);
    expect(stat("Focus")).toBeGreaterThan(focusBefore);
    expect(stat("Visibility")).toBeLessThan(visBefore);
  });

  it("hitting zero focus checks you out and blurs the feed", () => {
    join();
    tick(300_000); // way past the point of no return
    expect(stat("Focus")).toBe(0);
    expect(screen.getByText(/you're cooked/)).toBeInTheDocument();
    expect(screen.getByTestId("transcript").className).toContain("blur");
  });

  it("the meeting runs into overtime past 30:00", () => {
    join();
    tick(300_000); // 2100 game-seconds
    expect(screen.getByText("this meeting should have ended")).toBeInTheDocument();
  });
});
