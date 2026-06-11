"use client";

interface TechItem {
  name: string;
  purpose: string;
}

interface TechStackData {
  frontend?: TechItem[];
  backend?: TechItem[];
  ai_stack?: TechItem[];
  infrastructure?: TechItem[];
  description?: string;
}

export function TechStackBlock({ data }: { data: TechStackData }) {
  if (!data) return null;

  const categories: Array<{
    title: string;
    items?: TechItem[];
  }> = [
    { title: "Frontend", items: data.frontend },
    { title: "Backend", items: data.backend },
    { title: "AI Stack", items: data.ai_stack },
    { title: "Infrastructure", items: data.infrastructure },
  ];

  return (
    <div className="space-y-6">
      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {categories
          .filter((c) => c.items && c.items.length > 0)
          .map((category) => (
            <div key={category.title}>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                {category.title}
              </h4>
              <div className="space-y-2">
                {(category.items || []).map((item) => (
                  <div
                    key={item.name}
                    className="rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.purpose}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
