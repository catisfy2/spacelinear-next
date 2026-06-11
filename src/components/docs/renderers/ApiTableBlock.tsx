"use client";

import { Badge } from "@/components/ui/badge";

interface ApiEndpoint {
  method?: string;
  endpoint: string;
  description: string;
  auth?: string;
}

interface ApiService {
  service: string;
  description: string;
}

interface ApiTableData {
  internal_apis?: ApiEndpoint[];
  supabase_apis?: ApiService[];
  description?: string;
  auth_model?: string;
}

const methodColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  GET: "default",
  POST: "secondary",
  PUT: "outline",
  DELETE: "destructive",
  PATCH: "outline",
};

export function ApiTableBlock({ data }: { data: ApiTableData }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      {data.auth_model && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs font-medium text-muted-foreground">Auth Model</div>
          <div className="text-sm text-foreground">{data.auth_model}</div>
        </div>
      )}

      {data.internal_apis && data.internal_apis.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Internal APIs
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Endpoint</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Auth</th>
                </tr>
              </thead>
              <tbody>
                {data.internal_apis.map((api, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      {api.method && (
                        <Badge
                          variant={methodColors[api.method] || "outline"}
                          className="font-mono text-[10px]"
                        >
                          {api.method}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-foreground">
                      {api.endpoint}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {api.description}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {api.auth || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.supabase_apis && data.supabase_apis.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Supabase Services
          </h4>
          <div className="space-y-2">
            {data.supabase_apis.map((svc, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className="text-sm font-medium text-foreground">
                  {svc.service}
                </div>
                <div className="text-xs text-muted-foreground">
                  {svc.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
