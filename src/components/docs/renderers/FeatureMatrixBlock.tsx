"use client";

import { Badge } from "@/components/ui/badge";

interface Feature {
  name: string;
  status: "live" | "upcoming" | "planned";
  description: string;
}

interface Category {
  name: string;
  icon?: string;
  features: Feature[];
}

interface FeatureMatrixData {
  categories: Category[];
}

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  live: "default",
  upcoming: "secondary",
  planned: "outline",
};

const statusLabels: Record<string, string> = {
  live: "Live",
  upcoming: "Upcoming",
  planned: "Planned",
};

export function FeatureMatrixBlock({ data }: { data: FeatureMatrixData }) {
  if (!data?.categories) return null;

  return (
    <div className="space-y-8">
      {data.categories.map((category) => (
        <div key={category.name}>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            {category.name}
          </h4>
          <div className="space-y-2">
            {category.features.map((feature) => (
              <div
                key={feature.name}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {feature.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feature.description}
                  </div>
                </div>
                <Badge
                  variant={statusColors[feature.status] || "outline"}
                  className="ml-3 shrink-0"
                >
                  {statusLabels[feature.status] || feature.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
