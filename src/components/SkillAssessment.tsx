"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AssessmentResult = {
  total: number;
  correct: number;
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  language: string;
};

const QUESTION_BANK: Record<string, { id: string; q: string; options: { v: string; label: string; correct?: boolean; skill: string; }[] }[]> = {
  en: [
    { id: "q1", q: "Pick the data structure best for FIFO:", options: [
      { v: "stack", label: "Stack", skill: "tech" },
      { v: "queue", label: "Queue", skill: "tech", correct: true },
      { v: "tree", label: "Tree", skill: "tech" },
      { v: "graph", label: "Graph", skill: "tech" },
    ]},
    { id: "q2", q: "You must present a complex idea to a non-technical audience. What do you do first?", options: [
      { v: "jargon", label: "Use industry jargon", skill: "communication" },
      { v: "story", label: "Start with a simple story/analogy", skill: "communication", correct: true },
      { v: "charts", label: "Show 10 charts immediately", skill: "communication" },
      { v: "skip", label: "Skip context", skill: "communication" },
    ]},
    { id: "q3", q: "Which SQL clause filters rows?", options: [
      { v: "select", label: "SELECT", skill: "analysis" },
      { v: "where", label: "WHERE", skill: "analysis", correct: true },
      { v: "group", label: "GROUP BY", skill: "analysis" },
      { v: "join", label: "JOIN", skill: "analysis" },
    ]},
    { id: "q4", q: "A teammate is struggling. What's a good leadership approach?", options: [
      { v: "ignore", label: "Ignore to build resilience", skill: "leadership" },
      { v: "micromanage", label: "Micromanage details", skill: "leadership" },
      { v: "coach", label: "Offer coaching and set clear goals", skill: "leadership", correct: true },
      { v: "blame", label: "Publicly blame the teammate", skill: "leadership" },
    ]},
    { id: "q5", q: "Brainstorming aims to...", options: [
      { v: "criticize", label: "Criticize ideas early", skill: "creativity" },
      { v: "quantity", label: "Generate many ideas before judging", skill: "creativity", correct: true },
      { v: "solo", label: "Work strictly alone", skill: "creativity" },
      { v: "finalize", label: "Finalize the plan immediately", skill: "creativity" },
    ]},
    { id: "q6", q: "Time complexity of binary search?", options: [
      { v: "o1", label: "O(1)", skill: "tech" },
      { v: "on", label: "O(n)", skill: "tech" },
      { v: "ologn", label: "O(log n)", skill: "tech", correct: true },
      { v: "on2", label: "O(n^2)", skill: "tech" },
    ]},
    { id: "q7", q: "Which helps avoid bias in analysis?", options: [
      { v: "cherrypick", label: "Cherry-pick supporting data", skill: "analysis" },
      { v: "hypothesis", label: "Form a hypothesis and attempt falsification", skill: "analysis", correct: true },
      { v: "assume", label: "Assume correlations imply causation", skill: "analysis" },
      { v: "ignoreOutliers", label: "Ignore outliers always", skill: "analysis" },
    ]},
    { id: "q8", q: "Best way to give feedback?", options: [
      { v: "vague", label: "Be vague to be nice", skill: "communication" },
      { v: "specific", label: "Be specific, timely, and actionable", skill: "communication", correct: true },
      { v: "public", label: "Public criticism", skill: "communication" },
      { v: "delay", label: "Wait months", skill: "communication" },
    ]},
    { id: "q9", q: "MVP stands for:", options: [
      { v: "least", label: "Least Viable Product", skill: "creativity" },
      { v: "min", label: "Minimum Viable Product", skill: "creativity", correct: true },
      { v: "most", label: "Most Valuable Product", skill: "creativity" },
      { v: "market", label: "Market Valuable Plan", skill: "creativity" },
    ]},
    { id: "q10", q: "When delegating tasks, you should...", options: [
      { v: "vague2", label: "Keep goals vague", skill: "leadership" },
      { v: "clarity", label: "Clarify outcomes and autonomy", skill: "leadership", correct: true },
      { v: "oversee", label: "Oversee every minute", skill: "leadership" },
      { v: "noFollow", label: "Avoid follow-up", skill: "leadership" },
    ]},
    { id: "q11", q: "APIs communicate over...", options: [
      { v: "telepathy", label: "Telepathy", skill: "tech" },
      { v: "http", label: "HTTP/HTTPS", skill: "tech", correct: true },
      { v: "pdf", label: "PDF uploads", skill: "tech" },
      { v: "sms", label: "SMS only", skill: "tech" },
    ]},
    { id: "q12", q: "Which encourages innovation?", options: [
      { v: "punish", label: "Punish all failure", skill: "creativity" },
      { v: "psychSafety", label: "Psychological safety and experiments", skill: "creativity", correct: true },
      { v: "copy", label: "Copy competitors only", skill: "creativity" },
      { v: "neverChange", label: "Never change process", skill: "creativity" },
    ]},
  ],
  es: [
    { id: "q1es", q: "Estructura de datos para FIFO:", options: [
      { v: "pila", label: "Pila", skill: "tech" },
      { v: "cola", label: "Cola", skill: "tech", correct: true },
      { v: "arbol", label: "Árbol", skill: "tech" },
      { v: "grafo", label: "Grafo", skill: "tech" },
    ]},
    { id: "q2es", q: "Primero al presentar una idea compleja:", options: [
      { v: "jerga", label: "Usar jerga técnica", skill: "communication" },
      { v: "historia", label: "Empezar con una analogía", skill: "communication", correct: true },
      { v: "graficas", label: "Mostrar muchas gráficas", skill: "communication" },
      { v: "omitir", label: "Omitir contexto", skill: "communication" },
    ]},
  ],
  fr: [
    { id: "q1fr", q: "Structure de données pour FIFO:", options: [
      { v: "pile", label: "Pile", skill: "tech" },
      { v: "file", label: "File", skill: "tech", correct: true },
      { v: "arbre", label: "Arbre", skill: "tech" },
      { v: "graphe", label: "Graphe", skill: "tech" },
    ]},
  ],
  hi: [
    { id: "q1hi", q: "FIFO के लिए सही संरचना:", options: [
      { v: "stack_hi", label: "स्टैक", skill: "tech" },
      { v: "queue_hi", label: "क्यू", skill: "tech", correct: true },
      { v: "tree_hi", label: "ट्री", skill: "tech" },
      { v: "graph_hi", label: "ग्राफ", skill: "tech" },
    ]},
  ],
};

function pickAdaptiveQuestions(lang: string, count = 10) {
  const base = QUESTION_BANK[lang] && QUESTION_BANK[lang].length > 0 ? QUESTION_BANK[lang] : QUESTION_BANK.en;
  // Simple adaptive: shuffle and slice
  const shuffled = [...base].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default function SkillAssessment({ onComplete }: { onComplete: (r: AssessmentResult) => void }) {
  const [language, setLanguage] = useState<string>("en");
  const [questions, setQuestions] = useState(() => pickAdaptiveQuestions("en", 10));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setQuestions(pickAdaptiveQuestions(language, 10));
    setIndex(0);
    setAnswers({});
  }, [language]);

  const current = questions[index];
  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

  function selectAnswer(v: string) {
    if (!current) return;
    const next = { ...answers, [current.id]: v };
    setAnswers(next);
    // Move next or finish
    if (index < questions.length - 1) setIndex(index + 1);
    else finish(next);
  }

  function finish(ans: Record<string, string>) {
    const skills: Record<string, number> = {};
    let correct = 0;
    for (const q of questions) {
      const sel = ans[q.id];
      const opt = q.options.find(o => o.v === sel);
      if (!opt) continue;
      skills[opt.skill] = (skills[opt.skill] || 0) + (opt.correct ? 2 : 1);
      if (opt.correct) correct++;
    }
    const strengths = Object.entries(skills).sort((a,b) => b[1]-a[1]).slice(0,3).map(([k]) => k);
    const weaknesses = Object.entries(skills).sort((a,b) => a[1]-b[1]).slice(0,2).map(([k]) => k);
    const score = Math.round((correct / questions.length) * 100);
    const result: AssessmentResult = { total: questions.length, correct, score, strengths, weaknesses, language };
    try { localStorage.setItem("assessmentResult", JSON.stringify(result)); } catch {}
    onComplete(result);
  }

  return (
    <Card id="assessment">
      <CardHeader>
        <CardTitle>Skill Assessment</CardTitle>
        <CardDescription>10 adaptive questions in your language</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground">Language</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Choose language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-3 w-full sm:w-auto">
            <Progress value={progress} className="w-full sm:w-[200px]" />
            <span className="text-xs text-muted-foreground min-w-[40px] text-right">{progress}%</span>
          </div>
        </div>

        {current ? (
          <div className="space-y-3">
            <p className="font-medium">Q{index + 1}. {current.q}</p>
            <div className="grid gap-2">
              {current.options.map((o) => (
                <Button key={o.v} variant="outline" className="justify-start" onClick={() => selectAnswer(o.v)}>
                  {o.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" disabled={index===0} onClick={() => setIndex((i)=>Math.max(0,i-1))}>Back</Button>
              <span className="text-xs text-muted-foreground">{index+1}/{questions.length}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading questions...</p>
        )}
      </CardContent>
    </Card>
  );
}