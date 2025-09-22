"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AssessmentResult } from "./SkillAssessment";

const CAREER_MAP: Record<string, { title: string; skills: string[]; resources: { title: string; url: string }[] }[]> = {
  tech: [
    {
      title: "Software Engineer",
      skills: ["tech", "analysis", "communication"],
      resources: [
        { title: "Intro to Algorithms", url: "https://cs50.harvard.edu/" },
        { title: "Frontend Handbook", url: "https://frontendmasters.com/books/front-end-handbook/2019/" },
      ],
    },
    {
      title: "Data Analyst",
      skills: ["analysis", "tech", "communication"],
      resources: [
        { title: "SQL Tutorial", url: "https://www.sqltutorial.org/" },
        { title: "Data Visualization", url: "https://www.tableau.com/learn/training" },
      ],
    },
  ],
  creativity: [
    {
      title: "Product Designer",
      skills: ["creativity", "communication", "analysis"],
      resources: [
        { title: "Design Basics", url: "https://www.coursera.org/specializations/graphic-design" },
        { title: "Figma Learn", url: "https://help.figma.com/hc/en-us/articles/360040514733-Learn-design" },
      ],
    },
  ],
  leadership: [
    {
      title: "Team Lead",
      skills: ["leadership", "communication"],
      resources: [
        { title: "Situational Leadership", url: "https://www.coursera.org/learn/leadership-skills" },
        { title: "Crucial Conversations", url: "https://www.vitalsmarts.com/" },
      ],
    },
  ],
};

function pickCareers(result?: AssessmentResult) {
  if (!result) return CAREER_MAP.tech;
  const top = result.strengths[0] || "tech";
  const buckets = CAREER_MAP[top as keyof typeof CAREER_MAP] || CAREER_MAP.tech;
  return buckets;
}

export default function CareerDashboard({ result }: { result?: AssessmentResult }) {
  const [localRes, setLocalRes] = useState<AssessmentResult | undefined>(result);

  useEffect(() => {
    if (!result) {
      try {
        const raw = localStorage.getItem("assessmentResult");
        if (raw) setLocalRes(JSON.parse(raw));
      } catch {}
    }
  }, [result]);

  const careers = pickCareers(localRes);
  return (
    <section id="careers" className="grid gap-6 md:grid-cols-2">
      {careers.map((c) => (
        <Card key={c.title} className="overflow-hidden border-2">
          {/* Colorful header strip */}
          <div className="h-2 w-full bg-gradient-to-r from-fuchsia-500 via-orange-400 to-emerald-400" />
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {c.title}
              <div className="flex gap-1">
                {c.skills.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </CardTitle>
            <CardDescription>Based on your strengths</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p className="text-sm text-muted-foreground">Recommended resources:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {c.resources.map((r) => (
                <li key={r.url}><a className="underline text-fuchsia-700 dark:text-fuchsia-300 hover:text-fuchsia-500" href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
              <a href="#chat">Ask the AI Coach about {c.title}</a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}