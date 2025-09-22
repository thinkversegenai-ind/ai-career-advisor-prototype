"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AssessmentResult } from "./SkillAssessment";

export default function UserDashboard() {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [chatCount, setChatCount] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("assessmentResult");
      if (raw) setResult(JSON.parse(raw));
      const cc = Number(localStorage.getItem("chatCount")) || 0;
      setChatCount(cc);
    } catch {}
  }, []);

  const progress = useMemo(() => (result ? result.score : 0), [result]);
  const badges = useMemo(() => {
    const b: string[] = [];
    if ((result?.score || 0) >= 60) b.push("Skill Sprinter");
    if ((result?.correct || 0) >= 8) b.push("Top Scorer");
    if (chatCount >= 3) b.push("Curious Learner");
    return b;
  }, [result, chatCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1">
          <span className="text-sm text-muted-foreground">Overall Progress</span>
          <Progress value={progress} />
          <span className="text-xs text-muted-foreground">Score: {progress}%</span>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Badges</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {badges.length === 0 && (
              <span className="text-xs text-muted-foreground">Complete the assessment and chat to earn badges.</span>
            )}
            {badges.map((b) => (
              <Badge key={b}>{b}</Badge>
            ))}
          </div>
        </div>
        {result && (
          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">Top strengths</span>
            <div className="flex gap-2">
              {result.strengths.map((s) => (
                <Badge variant="secondary" key={s}>{s}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}