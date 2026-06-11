"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocsLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
}

export function DocsLayout({ children, sidebar, header }: DocsLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <a href="#cover" className="text-base font-semibold text-foreground">
              SpaceLinear
            </a>
          </div>
          {header && <div className="flex items-center gap-2">{header}</div>}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex gap-8 lg:gap-12">
          {/* Desktop sidebar */}
          <aside className="hidden w-56 shrink-0 md:block">
            <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-8">
              {sidebar}
            </div>
          </aside>

          {/* Mobile nav overlay */}
          {mobileNavOpen && (
            <div className="fixed inset-0 top-14 z-30 bg-background md:hidden">
              <nav className="overflow-y-auto px-4 py-6">{sidebar}</nav>
            </div>
          )}

          {/* Main content */}
          <main className="min-w-0 flex-1 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
