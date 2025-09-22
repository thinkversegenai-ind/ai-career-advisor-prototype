"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    synth.speak(utter);
  } catch {}
}

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export default function Chatbot({ onProgress }: { onProgress?: (count: number) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", role: "assistant", content: "Hi! Ask me about careers, skills, or learning paths." },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    try {
      const w = window as any;
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (SR) {
        const rec: SpeechRecognition = new SR();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (e: SpeechRecognitionEvent) => {
          const transcript = e.results[0][0].transcript;
          setInput(transcript);
        };
        rec.onend = () => setListening(false);
        recRef.current = rec;
      }
    } catch {}
  }, []);

  function reply(to: string): string {
    const t = to.toLowerCase();
    if (t.includes("software")) return "Software engineering blends problem solving with building products. Start with Python/JS and data structures.";
    if (t.includes("data")) return "Data roles value SQL, statistics, and storytelling. Practice with public datasets and Kaggle.";
    if (t.includes("design")) return "UX/UI design needs user research, prototyping, and critique. Learn Figma and usability principles.";
    return "Great question! Focus on consistent practice, feedback loops, and pick one project to apply your skills.";
  }

  function send() {
    const content = input.trim();
    if (!content) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const botText = reply(content);
    const botMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: botText };
    const next = [...messages, userMsg, botMsg];
    setMessages(next);
    setInput("");
    speak(botText);
    try { localStorage.setItem("chatCount", String((Number(localStorage.getItem("chatCount")) || 0) + 1)); } catch {}
    onProgress?.(next.filter(m => m.role === "user").length);
  }

  function toggleMic() {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      try { rec.stop(); } catch {}
      setListening(false);
    } else {
      try { rec.start(); setListening(true); } catch {}
    }
  }

  return (
    <Card id="chat">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">AI Coach <Badge variant="secondary">Voice</Badge></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-60 overflow-y-auto rounded border p-3 bg-background">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
              <div className={`inline-block rounded px-3 py-2 my-1 max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about careers, skills, learning..." />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant={listening ? "destructive" : "outline"} onClick={toggleMic}>{listening ? "Stop" : "Speak"}</Button>
            <Button type="button" onClick={send}>Send</Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Your chats improve personalized insights over time.</p>
      </CardFooter>
    </Card>
  );
}