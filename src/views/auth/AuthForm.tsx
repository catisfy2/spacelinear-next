"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export function AuthForm() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/today");
    }
  }, [loading, session, router]);

  if (loading || session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast("Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-sm mx-auto space-y-7 p-1"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1a1a1a]">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-sm text-[#6b6b6b]">
          {isSignUp
            ? "Sign up to get started with SpaceLinear"
            : "Sign in to continue with SpaceLinear"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-[#4a4a4a]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 bg-white/60 border-[#d4d0c8] text-[#1a1a1a] placeholder:text-[#a09b93] focus-visible:ring-[#c97a4a] rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-[#4a4a4a]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-11 bg-white/60 border-[#d4d0c8] text-[#1a1a1a] placeholder:text-[#a09b93] focus-visible:ring-[#c97a4a] rounded-lg"
          />
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-lg bg-[#c97a4a] hover:bg-[#b86a3a] text-white font-medium text-base shadow-sm"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm text-[#6b6b6b]">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-[#c97a4a] hover:underline font-medium"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}
