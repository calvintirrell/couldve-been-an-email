import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import App from "./App.jsx";

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
