"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-xl border bg-card text-card-foreground">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1549692520-acc6669e2f0c?q=80&w=2070&auto=format&fit=crop)",
        }}
      />
      <div className="p-8 md:p-12 lg:p-16 grid gap-6 md:grid-cols-2 items-center">
        <div className="space-y-4">
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Prototype
          </span>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            AI-Powered Personalized Skills & Career Advisor
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Discover your strengths, get tailored career paths, and learn with
            curated resources — all in one interactive experience.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="#assessment">
              <Button size="lg">Start Skill Assessment</Button>
            </Link>
            <Link href="#careers">
              <Button variant="outline" size="lg">Explore Careers</Button>
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:justify-items-end">
          <div className="rounded-lg border bg-background/60 backdrop-blur p-4 w-full max-w-md">
            <p className="text-sm text-muted-foreground">Preview</p>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded bg-muted" />
              <div className="h-2 w-5/6 rounded bg-muted" />
              <div className="h-2 w-3/4 rounded bg-muted" />
              <div className="h-2 w-2/3 rounded bg-muted" />
            </div>
          </div>
          <div className="rounded-lg border bg-background/60 backdrop-blur p-4 w-full max-w-md">
            <p className="text-sm text-muted-foreground">What's inside</p>
            <ul className="mt-2 text-sm grid gap-2">
              <li>• Adaptive skill assessment</li>
              <li>• Personalized career paths</li>
              <li>• AI chatbot with voice</li>
              <li>• Gamified progress & badges</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}