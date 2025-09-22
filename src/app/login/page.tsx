"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center px-4 py-10">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const callbackURL = params.get("redirect") || "/";
      const { error } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
        callbackURL,
      });
      if (error?.code) {
        setError("Invalid email or password. Please make sure you have registered.");
        setLoading(false);
        return;
      }
      router.push(callbackURL);
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-amber-400 to-emerald-400" />
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-fuchsia-500 to-orange-400 bg-clip-text text-transparent">Login</CardTitle>
        </CardHeader>
        <CardContent>
          {params.get("registered") === "true" && (
            <p className="mb-3 text-sm text-emerald-600">Account created! Please sign in.</p>
          )}
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e)=>setForm(v=>({...v,email:e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="off" required value={form.password} onChange={(e)=>setForm(v=>({...v,password:e.target.value}))} />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.rememberMe} onCheckedChange={(c)=>setForm(v=>({...v,rememberMe: Boolean(c)}))} />
                Remember me
              </label>
              <Button type="button" variant="link" className="px-0" onClick={()=>router.push("/register")}>Create account</Button>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}