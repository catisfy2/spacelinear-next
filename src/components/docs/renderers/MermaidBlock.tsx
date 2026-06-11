"use client";

import { useEffect, useRef, useState } from "react";

interface ArchitectureData {
  layers?: Array<{
    name: string;
    tech: string;
    responsibility: string;
  }>;
  description?: string;
  [key: string]: any;
}

function generateArchitectureMermaid(data: ArchitectureData): string {
  if (!data.layers) return "";
  const lines = ["graph TD"];
  for (let i = 0; i < data.layers.length; i++) {
    const layer = data.layers[i];
    lines.push(
      `  L${i}["<b>${layer.name}</b><br/>${layer.tech}<br/><i>${layer.responsibility}</i>"]`
    );
    if (i > 0) {
      lines.push(`  L${i - 1} --> L${i}`);
    }
  }
  return lines.join("\n");
}

export function MermaidBlock({ data }: { data: ArchitectureData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState(false);

  const definition = generateArchitectureMermaid(data);

  useEffect(() => {
    if (!definition || rendered) return;
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark")
            ? "dark"
            : "default",
          themeVariables: {
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
          },
        });

        const id = "mermaid-" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, definition);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setRendered(true);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [definition, rendered]);

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Failed to render diagram. Check the console for details.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}
      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto rounded-lg border border-border bg-card p-6"
      >
        <div className="animate-pulse text-sm text-muted-foreground">
          Loading diagram...
        </div>
      </div>
    </div>
  );
}
