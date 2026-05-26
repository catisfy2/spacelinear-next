import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

interface BreadcrumbNavProps {
  crumbs: Material[];
  onNavigate: (folderId: string | null) => void;
}

export function BreadcrumbNav({ crumbs, onNavigate }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:text-foreground hover:bg-accent"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">My Materials</span>
      </button>
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1 min-w-0">
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <button
            onClick={() => onNavigate(crumb.id)}
            className={cn(
              "truncate rounded-md px-1.5 py-1 transition-colors hover:text-foreground hover:bg-accent",
              i === crumbs.length - 1 && "text-foreground font-medium",
            )}
          >
            {crumb.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
