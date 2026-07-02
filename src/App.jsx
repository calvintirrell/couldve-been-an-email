import { useEffect, useRef, useState } from "react";
import { CAST } from "./game/content.js";
import {
  createGame,
  tick,
  toggleCamera,
  fmtClock,
  visibilityZone,
  clamp,
  SCHEDULED_END,
} from "./game/engine.js";

const TICK_MS = 250;

const focusLabel = (f) =>
  f > 60 ? "locked in" : f > 25 ? "drifting" : f > 0 ? "barely here" : "gone. fully checked out.";

const VIS_ZONE_LABEL = {
  low: "dangerously invisible",
  mid: "pleasantly forgettable (good)",
  high: "extremely perceivable",
};

function FocusBar({ value }) {
  return (
    <div className="h-3.5 w-full rounded-full bg-gray-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${clamp(value, 0, 100)}%`, background: value < 25 ? "#E03131" : "#4DABF7" }}
      />
    </div>
  );
}

function VisibilityGauge({ value }) {
  return (
    <div className="relative h-3.5 w-full rounded-full overflow-hidden flex">
      <div className="h-full bg-red-900/80" style={{ width: "18%" }} />
      <div className="h-full bg-emerald-800/80" style={{ width: "54%" }} />
      <div className="h-full bg-amber-800/80" style={{ width: "28%" }} />
      <div
        className="absolute top-0 h-full w-1.5 rounded-full bg-white shadow transition-all duration-300"
        style={{ left: `calc(${clamp(value, 0, 100)}% - 3px)` }}
      />
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("title"); // title | play
  const [declined, setDeclined] = useState(false);
  const [g, setG] = useState(createGame);
  const feedRef = useRef(null);

  // ---------- GAME LOOP ----------
  useEffect(() => {
    if (screen !== "play") return;
    const iv = setInterval(() => setG((s) => tick(s, TICK_MS / 1000)), TICK_MS);
    return () => clearInterval(iv);
  }, [screen]);

  // keep the feed pinned to the latest line
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [g.transcript.length]);

  const join = () => {
    setG(createGame());
    setScreen("play");
  };
  const leave = () => {
    setScreen("title");
    setDeclined(false);
  };

  if (screen === "title") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 font-sans text-gray-900">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-indigo-600 text-white px-8 py-4 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Calendar invite</div>
            <div className="text-xs opacity-80">Weekly · Recurring · Forever</div>
          </div>
          <div className="p-8">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Could've Been an Email</h1>
            <p className="text-gray-500 mb-6">
              <span className="font-semibold text-gray-700">Q3 Alignment Sync</span> · Scheduled: 30 minutes ·
              Actual: <span className="italic">we'll see</span>
            </p>
            <ul className="text-sm text-gray-600 space-y-2 mb-8">
              <li>🧠 <b>Focus</b> drains while you pay attention. You need it to survive the whole thing.</li>
              <li>👁️ <b>Visibility</b> is a Goldilocks meter. Too quiet and the boss notices. Too engaged and the action items find you.</li>
              <li>📋 Collect <b>3 action items</b> and you lose. They can smell enthusiasm.</li>
              <li>⏱️ The meeting is 30 minutes. The timer goes <b>up</b>. "Quick question" adds four.</li>
            </ul>
            <div className="space-y-2">
              <button
                onClick={join}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-lg transition-transform active:scale-95 hover:bg-indigo-700"
              >
                Accept · Join meeting
              </button>
              <button
                onClick={() => setDeclined(true)}
                className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm transition-transform active:scale-95"
              >
                {declined ? "Nice try. Attendance is mandatory." : "Decline"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Goal: reach adjournment with zero action items and eleven words spoken.</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MEETING ----------
  const overtime = g.gameSeconds > SCHEDULED_END;
  const checkedOut = g.focus <= 0;
  const lastSpeaker = g.transcript.length ? g.transcript[g.transcript.length - 1].speakerId : null;
  const zone = visibilityZone(g.visibility);

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="font-semibold truncate">Q3 Alignment Sync</span>
          </div>
          <div className="text-right">
            <div className={`font-mono text-lg font-bold tabular-nums ${overtime ? "text-red-400" : ""}`}>
              {fmtClock(g.gameSeconds)} <span className="text-gray-500 text-sm font-normal">/ 30:00 scheduled</span>
            </div>
            {overtime && <div className="text-xs text-red-400">this meeting should have ended</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 flex flex-col min-h-0">
        {/* Participant tiles */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
          {Object.entries(CAST).map(([id, c]) => (
            <div
              key={id}
              className={`rounded-lg bg-gray-950/70 border p-2 text-center transition-all ${
                lastSpeaker === id ? "border-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,.6)]" : "border-gray-800"
              }`}
            >
              <div className="text-2xl leading-none mb-1">{c.emoji}</div>
              <div className="text-[11px] font-semibold truncate">{c.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{id === "mute" ? "🔇 " : ""}{c.role}</div>
            </div>
          ))}
          <div className={`rounded-lg border p-2 text-center ${g.cameraOn ? "bg-gray-950/70 border-gray-700" : "bg-black border-gray-800"}`}>
            <div className="text-2xl leading-none mb-1">{g.cameraOn ? "🧑‍💻" : "📷"}</div>
            <div className="text-[11px] font-semibold">You</div>
            <div className="text-[10px] text-gray-500">{g.cameraOn ? "camera on" : "camera off"}</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
          {/* Transcript feed */}
          <div className="flex-1 flex flex-col min-h-0">
            <div
              ref={feedRef}
              data-testid="transcript"
              className={`flex-1 h-[45vh] md:h-auto overflow-y-auto bg-gray-950/60 rounded-xl border border-gray-800 p-4 space-y-2.5 ${
                checkedOut ? "blur-[1.5px] opacity-70" : ""
              }`}
            >
              {g.transcript.length === 0 && (
                <div className="text-sm text-gray-400 italic">Waiting for the host to start the meeting…</div>
              )}
              {g.transcript.map((l) => (
                <div key={l.id} className="text-sm leading-snug">
                  <span className="font-semibold mr-2" style={{ color: CAST[l.speakerId].color }}>
                    {CAST[l.speakerId].name}
                  </span>
                  <span className={l.muted || l.garbled ? "italic text-gray-500" : "text-gray-200"}>{l.text}</span>
                </div>
              ))}
            </div>
            {checkedOut && (
              <div className="text-xs text-red-400 mt-1.5">
                You are fully checked out. If someone calls on you right now, you're cooked.
              </div>
            )}
          </div>

          {/* Meters + controls */}
          <div className="w-full md:w-80 space-y-3">
            <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-medium text-gray-400">Focus</span>
                <span className="font-mono font-bold text-3xl">{Math.round(g.focus)}</span>
              </div>
              <FocusBar value={g.focus} />
              <div className="text-xs text-gray-500 mt-1.5">{focusLabel(g.focus)}</div>
            </div>

            <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-medium text-gray-400">Visibility</span>
                <span className="font-mono font-bold text-3xl">{Math.round(g.visibility)}</span>
              </div>
              <VisibilityGauge value={g.visibility} />
              <div className={`text-xs mt-1.5 ${zone === "mid" ? "text-gray-500" : "text-amber-400"}`}>
                {VIS_ZONE_LABEL[zone]}
              </div>
            </div>

            <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-gray-400">Action items</span>
                <span className="font-mono font-bold text-3xl">
                  {g.actionItems}<span className="text-sm text-gray-500">/3</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setG(toggleCamera)}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-transform active:scale-95 border ${
                g.cameraOn
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  : "bg-red-900/60 border-red-800 text-red-200"
              }`}
            >
              {g.cameraOn ? "🎥 Turn camera off" : "📷 Turn camera on"}
            </button>
            <p className="text-xs text-gray-500 -mt-1">
              Camera off regenerates Focus but tanks Visibility. Everyone notices the black tile.
            </p>

            <button
              onClick={leave}
              className="w-full py-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-sm font-semibold transition-transform active:scale-95"
            >
              Leave meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
