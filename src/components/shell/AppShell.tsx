"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  onOpenCoach,
}: {
  children: React.ReactNode;
  onOpenCoach?: () => void;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {!isMobile && <Sidebar onOpenCoach={onOpenCoach} />}
      {isMobile && (
        <div className="absolute left-3 top-3 z-40 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 border-border bg-background/95 shadow-sm backdrop-blur"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              hideClose
              className="flex h-full w-auto max-w-none flex-col gap-0 overflow-hidden border-r bg-sidebar p-0 shadow-none sm:max-w-none"
            >
              <Sidebar onOpenCoach={onOpenCoach} />
            </SheetContent>
          </Sheet>
        </div>
      )}
      <div className="relative flex-1 overflow-hidden">
        <main className="relative h-full flex-1 overflow-hidden">
          <div
            key={pathname}
            className={cn("absolute inset-0 overflow-y-auto", isMobile && "pt-14")}
          >
            {children}
          </div>
        </main>
        <Button
          type="button"
          size="icon"
          onClick={() => onOpenCoach?.()}
          className={cn(
            "fixed z-30 h-12 w-12 rounded-full shadow-lg",
            isMobile ? "bottom-5 right-4" : "bottom-6 right-6",
          )}
          aria-label="Open study coach"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
