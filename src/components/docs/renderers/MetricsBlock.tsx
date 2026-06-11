"use client";

interface KpiItem {
  metric: string;
  target: string;
  current: number | string;
}

interface MetricData {
  kpis?: KpiItem[];
  usage_metrics?: string[];
  current_load?: Record<string, string | number>;
}

export function MetricsBlock({ data }: { data: MetricData }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {data.kpis && data.kpis.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Key Performance Indicators
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Metric</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Current</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Target</th>
                </tr>
              </thead>
              <tbody>
                {data.kpis.map((kpi, i) => {
                  const currentVal = typeof kpi.current === "number"
                    ? kpi.current.toLocaleString()
                    : kpi.current;
                  const targetVal = kpi.target;

                  return (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-foreground">{kpi.metric}</td>
                      <td className="px-4 py-2 font-medium text-foreground">
                        {currentVal}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {targetVal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Current Load */}
      {data.current_load && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(data.current_load).map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="text-xs text-muted-foreground">
                {key.replace(/_/g, " ")}
              </div>
              <div className="text-lg font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Metrics */}
      {data.usage_metrics && data.usage_metrics.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">
            Usage Metrics
          </h4>
          <ul className="space-y-1">
            {data.usage_metrics.map((m, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
