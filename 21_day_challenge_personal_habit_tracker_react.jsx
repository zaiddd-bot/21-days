import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Flame,
  Plus,
  Trash2,
  Download,
  Upload,
  CalendarDays,
  Target,
  RotateCcw,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

// --- Utilities ---
const LS_KEY = "twentyone_challenges_v1";

const startOfDay = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const daysBetween = (a, b) => {
  const ms = startOfDay(b) - startOfDay(a);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const uid = () => Math.random().toString(36).slice(2, 9);

// --- Types ---
const BLANK = () => ({
  id: uid(),
  title: "My 21‑Day Challenge",
  notes: "e.g. Wake at 6am, 30m workout, 10m study sprint.",
  startDate: new Date().toISOString(),
  totalDays: 21,
  checks: Array(21).fill(false),
  strictMode: false, // if true, can only tick today or earlier in order
});

// --- Templates ---
const TEMPLATES = [
  {
    title: "Study Power‑Up",
    notes: "3 pomodoros daily + active recall. No phone till 9am.",
  },
  {
    title: "Fitness Reset",
    notes: "30m bodyweight workout + 8k steps + 2L water.",
  },
  {
    title: "Glow‑Up Routine",
    notes: "AM: cleanse + sunscreen. PM: cleanse + moisturizer. No sugar.",
  },
  {
    title: "Digital Discipline",
    notes: "No social media before lunch. 60m deep work daily.",
  },
];

// --- Core Component ---
export default function App() {
  const [challs, setChalls] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [BLANK()];
    } catch (e) {
      return [BLANK()];
    }
  });
  const [activeId, setActiveId] = useState(() => challs?.[0]?.id);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(challs));
  }, [challs]);

  const active = useMemo(
    () => challs.find((c) => c.id === activeId) || challs[0],
    [activeId, challs]
  );

  const setActive = (patch) => {
    setChalls((prev) => prev.map((c) => (c.id === active.id ? { ...c, ...patch } : c)));
  };

  const addChallenge = (tpl) => {
    const n = BLANK();
    if (tpl) {
      n.title = tpl.title;
      n.notes = tpl.notes;
    }
    setChalls((p) => [n, ...p]);
    setActiveId(n.id);
  };

  const removeChallenge = (id) => {
    setChalls((p) => p.filter((c) => c.id !== id));
    if (id === activeId && challs.length > 1) {
      setActiveId(challs.find((c) => c.id !== id)?.id);
    }
  };

  const todayIndex = useMemo(() => {
    if (!active) return 0;
    const diff = daysBetween(active.startDate, new Date());
    return clamp(diff, 0, active.totalDays - 1);
  }, [active]);

  const progress = useMemo(() => {
    if (!active) return 0;
    const done = active.checks.filter(Boolean).length;
    return Math.round((done / active.totalDays) * 100);
  }, [active]);

  const currentStreak = useMemo(() => {
    if (!active) return 0;
    let s = 0;
    for (let i = active.checks.length - 1; i >= 0; i--) {
      if (active.checks[i]) s++;
      else break;
    }
    return s;
  }, [active]);

  const longestStreak = useMemo(() => {
    if (!active) return 0;
    let best = 0, cur = 0;
    for (let i = 0; i < active.checks.length; i++) {
      cur = active.checks[i] ? cur + 1 : 0;
      if (cur > best) best = cur;
    }
    return best;
  }, [active]);

  const allDone = useMemo(() => active && active.checks.every(Boolean), [active]);

  useEffect(() => {
    if (allDone) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 2000);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  const toggleDay = (idx) => {
    if (!active) return;
    // Strict mode prevents checking future days and enforces order
    if (active.strictMode && idx > todayIndex) return;
    setActive({
      checks: active.checks.map((v, i) => (i === idx ? !v : v)),
    });
  };

  const markToday = () => toggleDay(todayIndex);

  const resetProgress = () => setActive({ checks: Array(active.totalDays).fill(false) });

  const exportData = () => {
    const data = JSON.stringify(challs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `21day-challenges-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          setChalls(parsed);
          setActiveId(parsed?.[0]?.id);
        }
      } catch (e) {
        alert("Invalid file");
      }
    };
    reader.readAsText(file);
  };

  if (!active) return <div className="p-6">Add a challenge to begin.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-indigo-50 text-zinc-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">21‑Day Challenge</h1>
            <p className="text-sm text-zinc-500">Build momentum, one tick at a time.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportData} className="gap-2"><Download className="h-4 w-4"/>Export</Button>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer bg-white">
              <Upload className="h-4 w-4"/>
              <span>Import</span>
              <input type="file" accept="application/json" className="hidden" onChange={(e)=> e.target.files?.[0] && importData(e.target.files[0])}/>
            </label>
          </div>
        </div>

        {/* Challenge Switcher */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {challs.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                active.id === c.id ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50"
              }`}
              title={new Date(c.startDate).toDateString()}
            >
              {c.title}
            </button>
          ))}
          <Button onClick={() => addChallenge()} size="sm" className="gap-1"><Plus className="h-4 w-4"/>New</Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left: Editor */}
          <Card className="lg:col-span-2">
            <div className="mb-4 p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 shadow-sm text-center animate-fade-in">
  <p className="text-sm font-medium text-purple-700 italic">
    "You are becoming the person who follows through. Keep going."
  </p>
</div>

<CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5"/>
                <Input
                  value={active.title}
                  onChange={(e) => setActive({ title: e.target.value })}
                  className="border-0 text-xl font-semibold px-0 focus-visible:ring-0"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Start date</label>
                  <Input
                    type="date"
                    value={new Date(active.startDate).toISOString().slice(0, 10)}
                    onChange={(e) => setActive({ startDate: new Date(e.target.value).toISOString(), checks: Array(active.totalDays).fill(false) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Total days</label>
                  <Input
                    type="number"
                    min={7}
                    max={90}
                    value={active.totalDays}
                    onChange={(e) => {
                      const n = clamp(parseInt(e.target.value || 21), 7, 90);
                      const resized = [...active.checks];
                      resized.length = n;
                      for (let i = 0; i < n; i++) if (typeof resized[i] !== "boolean") resized[i] = false;
                      setActive({ totalDays: n, checks: resized });
                    }}
                  />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="space-y-1.5 w-full">
                    <label className="text-xs text-zinc-500">Strict mode</label>
                    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                      <span className="text-sm">Tick in order only</span>
                      <Switch checked={active.strictMode} onCheckedChange={(v) => setActive({ strictMode: v })}/>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Rules / notes</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 min-h-[84px]"
                  value={active.notes}
                  onChange={(e) => setActive({ notes: e.target.value })}
                />
              </div>

              {/* Templates */}
              <div className="flex flex-wrap items-center gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.title} onClick={() => setActive({ title: t.title, notes: t.notes })} className="text-xs px-2.5 py-1 rounded-full border bg-white hover:bg-zinc-50">
                    Use “{t.title}”
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4"/>
                    <span className="text-sm text-zinc-600">Day {todayIndex + 1} of {active.totalDays}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={resetProgress} className="gap-1"><RotateCcw className="h-4 w-4"/>Reset</Button>
                    <Button size="sm" onClick={markToday} className="gap-1"><Check className="h-4 w-4"/>Mark today</Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: active.totalDays }).map((_, i) => {
                    const isPastOrToday = i <= todayIndex;
                    const checked = active.checks[i];
                    const canClick = isPastOrToday || !active.strictMode;
                    return (
                      <button
                        key={i}
                        onClick={() => canClick && toggleDay(i)}
                        className={`aspect-square rounded-xl border flex items-center justify-center text-sm select-none transition ${
                          checked
                            ? "bg-zinc-900 text-white border-zinc-900 shadow"
                            : canClick
                            ? "bg-white hover:bg-zinc-50"
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                        title={`Day ${i + 1}`}
                      >
                        {checked ? <Check className="h-4 w-4"/> : i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Stats & Danger */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{progress}% complete</span>
                  <span>{active.checks.filter(Boolean).length}/{active.totalDays} days</span>
                </div>
                <Progress value={progress} />
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Stat label="Current streak" value={`${currentStreak} 🔥`} icon={<Flame className="h-4 w-4"/>} />
                  <Stat label="Longest streak" value={longestStreak} />
                  <Stat label="Started" value={new Date(active.startDate).toLocaleDateString()} />
                  <Stat label="Ends" value={new Date(startOfDay(active.startDate).getTime() + (active.totalDays - 1) * 86400000).toLocaleDateString()} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Danger zone</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <Button variant="destructive" className="gap-2" onClick={() => removeChallenge(active.id)}>
                  <Trash2 className="h-4 w-4"/> Delete challenge
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => navigator.clipboard.writeText(summaryText(active))}>
                  <Share2 className="h-4 w-4"/> Copy summary
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Celebrate overlay */}
        <AnimatePresence>
          {celebrate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 backdrop-blur px-6 py-4 rounded-2xl shadow-2xl border text-center"
              >
                <div className="text-2xl font-bold">21/21 — You did it! 🎉</div>
                <div className="text-sm text-zinc-600">Take a screenshot and start a new run!</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reflection / Goals */}
        <Card className="mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reflection & Growth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">What can I improve?</label>
              <textarea className="w-full rounded-md border px-3 py-2 min-h-[70px]" placeholder="Be honest, be kind to yourself..."></textarea>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">What am I doing wrong or repeating?</label>
              <textarea className="w-full rounded-md border px-3 py-2 min-h-[70px]" placeholder="Patterns, distractions, mistakes you want to break..."></textarea>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">This Month's Goal</label>
              <textarea className="w-full rounded-md border px-3 py-2 min-h-[70px]" placeholder="One clear goal for next 30 days..."></textarea>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Future Vision / What I want to become</label>
              <textarea className="w-full rounded-md border px-3 py-2 min-h-[70px]" placeholder="Describe who you're becoming, not just what you're doing."></textarea>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="pt-8 text-center text-xs text-zinc-500">
          Built with ❤️ — stored locally in your browser.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-xl border p-3 bg-white">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold flex items-center gap-2">{icon}{value}</div>
    </div>
  );
}

function summaryText(c){
  const done = c.checks.filter(Boolean).length;
  const pct = Math.round((done / c.totalDays) * 100);
  const started = new Date(c.startDate).toLocaleDateString();
  const ends = new Date(startOfDay(c.startDate).getTime() + (c.totalDays - 1) * 86400000).toLocaleDateString();
  return `21‑Day Challenge: ${c.title}\nStarted: ${started}  Ends: ${ends}\nProgress: ${done}/${c.totalDays} (${pct}%)\nNotes: ${c.notes}`;
}
