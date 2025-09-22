"use client";

import Hero from "@/components/Hero";
import SidePanels from "@/components/SidePanels";

export default function HomePage() {
  return (
    <div className="min-h-screen font-sans">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 space-y-10">
        <Hero />

        <div className="rounded-2xl border overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-fuchsia-500 via-amber-400 to-emerald-400" />
          <div className="p-5 bg-card text-card-foreground">
            <h3 className="font-semibold">Open the side panels to use the app</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use the floating buttons at the bottom-right to access Assessment, Careers, Daily Coach (streaks + tasks + reminder), AI Coach, and your Profile.
            </p>
          </div>
        </div>

        <footer className="text-center text-xs text-muted-foreground py-6">
          Prototype for demo purposes.
        </footer>
      </div>
      <SidePanels />
    </div>
  );
}