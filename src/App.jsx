import { useState } from "react";

export default function App() {
  const [screen, setScreen] = useState("title"); // title | play
  const [declined, setDeclined] = useState(false);

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
                onClick={() => setScreen("play")}
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

  // ---------- MEETING SHELL (engine arrives in Phase 2) ----------
  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="font-semibold truncate">Q3 Alignment Sync</span>
          </div>
          <div className="font-mono text-lg font-bold tabular-nums">
            0:00 <span className="text-gray-500 text-sm font-normal">/ 30:00 scheduled</span>
          </div>
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 flex flex-col">
        <div className="flex-1 bg-gray-950/60 rounded-xl border border-gray-800 p-4 text-sm text-gray-400 italic">
          Waiting for the host to start the meeting…
        </div>

        {/* Meters */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-500">Focus</div>
            <div className="font-mono font-bold text-2xl">100</div>
          </div>
          <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-500">Visibility</div>
            <div className="font-mono font-bold text-2xl">50</div>
          </div>
          <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-500">Action items</div>
            <div className="font-mono font-bold text-2xl">0<span className="text-sm text-gray-500">/3</span></div>
          </div>
        </div>

        <button
          onClick={() => {
            setScreen("title");
            setDeclined(false);
          }}
          className="mt-4 self-end px-4 py-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-sm font-semibold transition-transform active:scale-95"
        >
          Leave meeting
        </button>
      </div>
    </div>
  );
}
