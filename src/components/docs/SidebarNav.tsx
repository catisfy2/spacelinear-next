"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NavItem {
  slug: string;
  title: string;
  category: string;
}

interface SidebarNavProps {
  items: NavItem[];
  coverTitle?: string;
}

export function SidebarNav({ items, coverTitle }: SidebarNavProps) {
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section-slug");
            if (id) setActiveSlug(id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    const elements = document.querySelectorAll("[data-section-slug]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  const categoryLabels: Record<string, string> = {
    pitch: "Pitch Deck",
    technical: "Technical",
    admin: "Reference",
  };

  return (
    <nav className="space-y-6">
      {coverTitle && (
        <a
          href="#cover"
          className={cn(
            "block text-sm font-medium transition-colors hover:text-foreground",
            activeSlug === "cover" || activeSlug === ""
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {coverTitle}
        </a>
      )}

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {categoryLabels[category] || category}
          </p>
          <ul className="space-y-1">
            {categoryItems.map((item) => (
              <li key={item.slug}>
                <a
                  href={`#section-${item.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(`section-${item.slug}`);
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-sm transition-colors",
                    activeSlug === item.slug
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
