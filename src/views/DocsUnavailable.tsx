"use client";

import Link from "next/link";
import { FileX2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocsUnavailable() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="mx-auto max-w-md text-center">
        <FileX2 className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
          Documentation Not Available
        </h1>
        <p className="mb-8 text-muted-foreground">
          The documentation page is currently not accessible. It may be
          restricted based on a scheduled publishing window or administrative
          settings. Please check back later.
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
