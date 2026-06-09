"use client";

import { Loader2 } from "lucide-react";
import { SlideCarousel } from "@/views/auth/SlideCarousel";
import { AuthForm } from "@/views/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";

export function AuthPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex w-screen h-screen items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen">
      <div className="w-1/2 h-full relative">
        <SlideCarousel />
      </div>
      <div className="w-1/2 h-full bg-gradient-to-br from-[#faf9f5] via-[#f5f1ec] to-[#f0eae3] flex items-center justify-center p-10">
        <div className="w-full max-w-sm bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 p-8">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
