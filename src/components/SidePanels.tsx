"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SkillAssessment, { type AssessmentResult } from "./SkillAssessment";
import CareerDashboard from "./CareerDashboard";
import Chatbot from "./Chatbot";
import UserDashboard from "./UserDashboard";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
// added auth/session imports
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// Small utility – safe localStorage get/set
function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// Generate daily tasks from assessment (prioritize weaknesses)
function generateDailyTasks(result?: AssessmentResult) {
  const base: { id: string; label: string; skill: string }[] = [];
  const weaknesses = result?.weaknesses || ["analysis", "communication"]; // defaults
  const strengths = result?.strengths || ["tech", "creativity"]; // defaults

  const lib: Record<string, string[]> = {
    tech: ["Solve 2 easy DS/Algo problems", "Read 5 pages of CS fundamentals", "Practice 20 mins of coding"],
    analysis: ["Write 3 SQL queries on dummy data", "Explain one chart insight in 3 lines", "Review a dataset for outliers"],
    communication: ["Summarize an article in 5 bullet points", "Record a 1-min clarity pitch", "Give specific feedback on a topic"],
    creativity: ["Sketch 3 alternative UI ideas", "Brainstorm 10 ideas quickly", "Remix a feature from a favorite app"],
    leadership: ["Set one clear goal with metrics", "Coach a peer for 10 mins", "Delegate a small task with outcomes"],
  };

  // 2 from weaknesses (if available), 1 from a strength
  for (const w of weaknesses.slice(0, 2)) {
    const pool = lib[w] || lib.analysis;
    base.push({ id: `w-${w}-1`, label: pool[0], skill: w });
  }
  const s = strengths[0] || "tech";
  const sp = lib[s] || lib.tech;
  base.push({ id: `s-${s}-1`, label: sp[1], skill: s });

  return base;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function FloatingLaunchpad({ onAssessment }: { onAssessment?: (r: AssessmentResult) => void }) {
  const [result, setResult] = useState<AssessmentResult | undefined>(undefined);
  const [streak, setStreak] = useState<number>(0);
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [dailyTasks, setDailyTasks] = useState<{ id: string; label: string; skill: string; done: boolean; dbId?: number }[]>([]);
  const [reminder, setReminder] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return lsGet<string>("reminderTime", "19:00");
  });
  const [reminderDue, setReminderDue] = useState(false);
  const intervalRef = useRef<number | null>(null);
  // session + router
  const { data: session } = useSession();
  const router = useRouter();

  // helper to get bearer token
  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("bearer_token") || "" : "");

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem("assessmentResult");
      if (raw) setResult(JSON.parse(raw));
      const streakVal = lsGet<number>("dailyStreak", 0);
      const last = lsGet<string | null>("lastActiveDate", null);
      setStreak(streakVal);
      setLastActive(last);

      // tasks per day key
      const todayKey = `tasks-${new Date().toDateString()}`;
      const existing = lsGet<typeof dailyTasks | null>(todayKey, null);
      if (existing) setDailyTasks(existing);
      else {
        const gen = generateDailyTasks(raw ? JSON.parse(raw) : undefined).map(t => ({ ...t, done: false }));
        setDailyTasks(gen);
        lsSet(todayKey, gen);
      }
    } catch {}
  }, []);

  // sync streak from API when logged in
  useEffect(() => {
    const fetchStreak = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/streak", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        if (res.ok && json?.data) {
          setStreak(json.data.current_streak || 0);
          setLastActive(json.data.last_active_date || null);
        }
      } catch {}
    };
    fetchStreak();
  }, [session?.user]);

  // sync today's tasks with API when logged in (fetch or seed from generated)
  useEffect(() => {
    const syncTasks = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch(`/api/tasks?due_date=today&limit=50`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        if (res.ok) {
          const apiTasks: any[] = json?.data || [];
          if (apiTasks.length > 0) {
            const mapped = apiTasks.map((t) => ({ id: `db-${t.id}`, dbId: t.id, label: t.label, skill: t.skill || "general", done: !!t.done }));
            setDailyTasks(mapped);
            lsSet(`tasks-${new Date().toDateString()}`, mapped);
          } else {
            // seed from generated tasks
            const generated = generateDailyTasks(result).map((t) => ({ label: t.label, skill: t.skill, done: false, dueDate: new Date().toISOString().split("T")[0] }));
            const createRes = await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
              body: JSON.stringify(generated),
            });
            const createdJson = await createRes.json();
            if (createRes.ok) {
              const created = Array.isArray(createdJson.data) ? createdJson.data : [createdJson.data];
              const mapped = created.map((t: any) => ({ id: `db-${t.id}`, dbId: t.id, label: t.label, skill: t.skill || "general", done: !!t.done }));
              setDailyTasks(mapped);
              lsSet(`tasks-${new Date().toDateString()}`, mapped);
            }
          }
        }
      } catch {}
    };
    syncTasks();
    // only when session becomes available or result changes significantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  // reminder checker – set a tiny in-app indicator
  useEffect(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (!reminder) return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const current = `${hh}:${mm}`;
      const acknowledged = lsGet<string | null>("reminderAckDate", null);
      const todayStr = new Date().toDateString();
      if (current === reminder && acknowledged !== todayStr) {
        setReminderDue(true);
      }
    }, 30000) as unknown as number;
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [reminder]);

  function acknowledgeReminder() {
    setReminderDue(false);
    lsSet("reminderAckDate", new Date().toDateString());
  }

  async function markDoneToday() {
    const today = new Date();
    const last = lastActive ? new Date(last) : null;
    let nextStreak = streak;
    if (!last || (last && !isSameDay(today, last))) {
      // if last is exactly yesterday, increment, else reset to 1
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (last && isSameDay(last, yesterday)) nextStreak = streak + 1;
      else nextStreak = 1;
    }
    setStreak(nextStreak);
    setLastActive(today.toISOString());
    lsSet("dailyStreak", nextStreak);
    lsSet("lastActiveDate", today.toISOString());

    // sync to API if logged in
    if (session?.user) {
      try {
        const res = await fetch("/api/streak", {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        if (res.ok && json?.data) {
          setStreak(json.data.current_streak || nextStreak);
          setLastActive(json.data.last_active_date || today.toISOString());
        }
      } catch {}
    }
  }

  async function toggleTask(id: string) {
    const todayKey = `tasks-${new Date().toDateString()}`;
    const updated = dailyTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setDailyTasks(updated);
    lsSet(todayKey, updated);

    // persist to API if logged in
    if (session?.user) {
      const task = updated.find(t => t.id === id);
      if (!task) return;
      try {
        if (task.dbId) {
          await fetch(`/api/tasks?id=${task.dbId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ done: task.done }),
          });
        }
      } catch {}
    }
  }

  const onReminderChange = async (val: string) => {
    setReminder(val);
    lsSet("reminderTime", val);
    setReminderDue(false);
    if (session?.user) {
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ profile: { reminderTime: val } }),
        });
      } catch {}
    }
  };

  const completedCount = useMemo(() => dailyTasks.filter(t => t.done).length, [dailyTasks]);
  const progressPct = dailyTasks.length ? Math.round((completedCount / dailyTasks.length) * 100) : 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Assessment */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="shadow-lg bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 text-white">Assessment</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[420px] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle className="bg-gradient-to-r from-fuchsia-500 to-orange-400 bg-clip-text text-transparent">Skill Assessment</SheetTitle>
            <SheetDescription>Answer 10 questions. Your results will update tasks and careers.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <SkillAssessment onComplete={async (r)=>{ 
              setResult(r); 
              onAssessment?.(r);
              try { localStorage.setItem("assessmentResult", JSON.stringify(r)); } catch {}
              // persist assessment if logged in
              if (session?.user) {
                try {
                  await fetch("/api/assessments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ answers: {}, result: r }),
                  });
                } catch {}
              }
            }} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Careers */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="shadow-lg bg-gradient-to-r from-sky-500 to-emerald-400 text-white">Careers</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[420px] sm:w-[520px]">
          <SheetHeader>
            <SheetTitle className="bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent">Career Recommendations</SheetTitle>
            <SheetDescription>Curated roles and learning links—no images, fast to scan.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <CareerDashboard result={result} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Daily (Streaks + Tasks + Reminder) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className={cn(
            "shadow-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white relative",
            reminderDue && "animate-pulse"
          )}>
            Daily {reminderDue && (<Badge variant="destructive" className="absolute -top-2 -right-2">Due</Badge>)}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[420px] sm:w-[520px]">
          <SheetHeader>
            <SheetTitle className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">Daily Coach</SheetTitle>
            <SheetDescription>Track your streak, complete tasks, and set a reminder.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-6">
            <Card>
              <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Streak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🔥</span>
                  <div>
                    <div className="text-2xl font-semibold">{streak} day{streak===1?"":"s"}</div>
                    <div className="text-xs text-muted-foreground">Tap when you complete learning today.</div>
                  </div>
                </div>
                <Button onClick={markDoneToday} className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">Mark done today</Button>
              </CardContent>
            </Card>

            <Card>
              <div className="h-2 w-full bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Today's Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Progress value={progressPct} className="w-full" />
                  <span className="text-xs text-muted-foreground w-12 text-right">{progressPct}%</span>
                </div>
                <ul className="space-y-2">
                  {dailyTasks.map(t => (
                    <li key={t.id} className="flex items-start gap-3">
                      <Checkbox id={t.id} checked={t.done} onCheckedChange={() => toggleTask(t.id)} />
                      <label htmlFor={t.id} className={cn("text-sm leading-tight cursor-pointer", t.done && "line-through text-muted-foreground")}>{t.label}
                        <span className="ml-2"><Badge variant="secondary">{t.skill}</Badge></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-pink-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Reminder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Choose a daily time (24h) to get a subtle in-app cue.</p>
                <div className="flex items-center gap-2">
                  <Input type="time" value={reminder} onChange={(e)=> onReminderChange(e.target.value)} className="max-w-[160px]" />
                  {reminderDue && <Button variant="outline" onClick={acknowledgeReminder}>Got it</Button>}
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Chat */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="shadow-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white">AI Coach</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[420px] sm:w-[520px]">
          <SheetHeader>
            <SheetTitle className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">AI Coach</SheetTitle>
            <SheetDescription>Chat or use voice. Conversations contribute to badges.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4" id="chat">
            <Chatbot />
          </div>
        </SheetContent>
      </Sheet>

      {/* Profile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="shadow-lg bg-gradient-to-r from-emerald-500 to-lime-400 text-foreground">Profile</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[420px] sm:w-[520px]">
          <SheetHeader>
            <SheetTitle className="bg-gradient-to-r from-emerald-500 to-lime-400 bg-clip-text text-transparent">Your Dashboard</SheetTitle>
            <SheetDescription>Progress, badges, and strengths overview.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {/* session-aware actions */}
            {session?.user ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Signed in as</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground truncate">{session.user.email}</div>
                  <Button
                    variant="outline"
                    onClick={async ()=>{
                      const { error } = await authClient.signOut({
                        fetchOptions: { headers: { Authorization: `Bearer ${getToken()}` } },
                      });
                      if (!error?.code) {
                        localStorage.removeItem("bearer_token");
                        window.location.href = "/";
                      }
                    }}
                  >Sign out</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={()=>router.push("/login")}>Login</Button>
                <Button variant="secondary" onClick={()=>router.push("/register")}>Register</Button>
              </div>
            )}

            <UserDashboard />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function SidePanels() {
  const [res, setRes] = useState<AssessmentResult | undefined>(undefined);
  return (
    <>
      <FloatingLaunchpad onAssessment={setRes} />
      {/* Decorative corner ribbon for colorful UI accent */}
      <div className="pointer-events-none fixed bottom-0 left-0 z-40 h-24 w-24 bg-gradient-to-tr from-fuchsia-500/30 via-emerald-400/30 to-indigo-500/30 blur-2xl" />
    </>
  );
}