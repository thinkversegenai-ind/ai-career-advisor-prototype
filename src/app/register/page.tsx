"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        email: form.email,
        name: form.name,
        password: form.password,
      });
      if (error?.code) {
        setError(error.code === "USER_ALREADY_EXISTS" ? "Email already registered" : "Registration failed");
        setLoading(false);
        return;
      }
      router.push("/login?registered=true");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-amber-400 to-emerald-400" />
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={form.name} onChange={(e)=>setForm(v=>({...v,name:e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e)=>setForm(v=>({...v,email:e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="off" required value={form.password} onChange={(e)=>setForm(v=>({...v,password:e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" autoComplete="off" required value={form.confirm} onChange={(e)=>setForm(v=>({...v,confirm:e.target.value}))} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-emerald-400 text-white">
              {loading ? "Creating account..." : "Register"}
            </Button>
            <Button type="button" variant="link" className="w-full" onClick={()=>router.push("/login")}>Already have an account? Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}