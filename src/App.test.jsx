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

  it("the clock turns red past the scheduled 30:00", () => {
    join();
    tick(300_000); // 2100 game-seconds
    const clock = screen.getByText("/ 30:00 scheduled").closest("div");
    expect(clock.className).toContain("text-red-400");
  });

  it("coworkers add time and the clock announces the new end", () => {
    join();
    let found = false;
    for (let i = 0; i < 400 && !found; i++) {
      tick(250);
      found = !!screen.queryByText(/now ending ~|\+\d+:\d+ ·/);
    }
    expect(found).toBe(true);
  });

  it("a hot potato standoff triggers, and volunteering takes the item", () => {
    join();
    let found = false;
    for (let i = 0; i < 800 && !found; i++) {
      tick(250);
      found = !!screen.queryByText(/hot potato/i);
    }
    expect(found).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /I'll own it/ }));
    expect(screen.queryByText(/hot potato/i)).not.toBeInTheDocument();
    expect(stat("Action items")).toBe(1);
  });

  it("a nod prompt appears and nodding resolves it", () => {
    join();
    tick(9500); // first nod prompt spawns at 60 game-seconds (~8.6 real s)
    expect(screen.getByText(/seems to expect acknowledgment/)).toBeInTheDocument();
    const visBefore = stat("Visibility");
    fireEvent.click(screen.getByRole("button", { name: "👍 Nod" }));
    expect(screen.queryByText(/seems to expect acknowledgment/)).not.toBeInTheDocument();
    expect(stat("Visibility")).toBeGreaterThan(visBefore);
  });

  it("eventually you get called on, and responding closes the modal", () => {
    join();
    let found = false;
    for (let i = 0; i < 600 && !found; i++) {
      tick(250);
      found = !!screen.queryByText(/You've been called on/);
    }
    expect(found).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /"Good point."/ }));
    expect(screen.queryByText(/You've been called on/)).not.toBeInTheDocument();
    expect(screen.getByText(/Nobody can prove it wasn't/)).toBeInTheDocument();
  });

  it("special moves land in the transcript and lock out", () => {
    join();
    tick(1000);
    fireEvent.click(screen.getByRole("button", { name: /take this offline/ }));
    expect(screen.getByText(/The tangent dies instantly/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /take this offline/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /hard stop at :30/ }));
    expect(screen.getByText(/somewhere better to be/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hard stop at :30/ })).toBeDisabled();
  });
});
