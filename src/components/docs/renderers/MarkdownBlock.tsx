"use client";

interface MarkdownBlockProps {
  data: Record<string, any>;
}

export function MarkdownBlock({ data }: MarkdownBlockProps) {
  const fields = [
    "body",
    "description",
    "problem_statement",
    "solution_statement",
    "vision_statement",
    "heading",
    "market_size",
    "target_segment",
  ];

  const rendered = new Set<string>();

  return (
    <div className="space-y-6">
      {/* Heading */}
      {data.heading && (
        <h3 className="text-xl font-semibold text-foreground">{data.heading}</h3>
      )}

      {/* Body markdown / description blocks */}
      {fields.map((field) => {
        if (!data[field] || rendered.has(field)) return null;
        rendered.add(field);
        return (
          <div key={field} className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {data[field]}
          </div>
        );
      })}

      {/* Pain points list */}
      {data.pain_points && (
        <ul className="space-y-2">
          {(data.pain_points as string[]).map((point: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {point}
            </li>
          ))}
        </ul>
      )}

      {/* Key benefits */}
      {data.key_benefits && (
        <ul className="space-y-2">
          {(data.key_benefits as string[]).map((benefit: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {benefit}
            </li>
          ))}
        </ul>
      )}

      {/* Target users */}
      {data.target_users && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Target Users</h4>
          <ul className="space-y-1">
            {(data.target_users as string[]).map((u: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {u}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Core use cases */}
      {data.core_use_cases && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Core Use Cases</h4>
          <ul className="space-y-1">
            {(data.core_use_cases as string[]).map((c: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Market trends */}
      {data.trends && (
        <ul className="space-y-2">
          {(data.trends as string[]).map((trend: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {trend}
            </li>
          ))}
        </ul>
      )}

      {/* Revenue streams */}
      {data.revenue_streams && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Revenue Streams</h4>
          {(data.revenue_streams as any[]).map((rs: any, i: number) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <div className="text-sm font-medium text-foreground">{rs.name}</div>
              <div className="text-sm text-muted-foreground">{rs.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Competitors */}
      {data.competitors && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Competitors</h4>
          {(data.competitors as any[]).map((comp: any, i: number) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <div className="text-sm font-medium text-foreground">{comp.name}</div>
              <div className="text-sm text-muted-foreground">{comp.weakness}</div>
            </div>
          ))}
        </div>
      )}

      {/* Moat */}
      {data.moat && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Our Moat</h4>
          <ul className="space-y-1">
            {(data.moat as string[]).map((m: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Channels */}
      {data.channels && (
        <ul className="space-y-2">
          {(data.channels as string[]).map((ch: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {ch}
            </li>
          ))}
        </ul>
      )}

      {/* Growth plan */}
      {data.growth_plan && (
        <div className="space-y-2">
          {(data.growth_plan as string[]).map((g: string, i: number) => (
            <div key={i} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Phase {i + 1}:</span> {g}
            </div>
          ))}
        </div>
      )}

      {/* Future plans */}
      {data.future_plans && (
        <ul className="space-y-2">
          {(data.future_plans as string[]).map((fp: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {fp}
            </li>
          ))}
        </ul>
      )}

      {/* Plan description / scalability items */}
      {data.scalability_approach && (
        <ul className="space-y-2">
          {(data.scalability_approach as string[]).map((s: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {s}
            </li>
          ))}
        </ul>
      )}

      {data.optimization_strategies && (
        <ul className="space-y-2">
          {(data.optimization_strategies as string[]).map((s: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {s}
            </li>
          ))}
        </ul>
      )}

      {data.data_protection && (
        <ul className="space-y-2">
          {(data.data_protection as string[]).map((d: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {d}
            </li>
          ))}
        </ul>
      )}

      {/* Generic text fields */}
      {data.storage && (
        <p className="text-sm text-muted-foreground">{data.storage}</p>
      )}
      {data.rag_pipeline && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">RAG Pipeline</h4>
          <p className="text-sm text-muted-foreground">{data.rag_pipeline}</p>
        </div>
      )}
      {data.personalization && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Personalization</h4>
          <p className="text-sm text-muted-foreground">{data.personalization}</p>
        </div>
      )}
      {data.explainability && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Explainability</h4>
          <p className="text-sm text-muted-foreground">{data.explainability}</p>
        </div>
      )}
      {data.authentication && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Authentication</h4>
          <p className="text-sm text-muted-foreground">{data.authentication}</p>
        </div>
      )}
      {data.authorization && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Authorization</h4>
          <p className="text-sm text-muted-foreground">{data.authorization}</p>
        </div>
      )}
      {data.rbac && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Role-Based Access Control</h4>
          <p className="text-sm text-muted-foreground">{data.rbac}</p>
        </div>
      )}

      {/* Data sources */}
      {data.data_sources && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Data Sources</h4>
          <ul className="space-y-1">
            {(data.data_sources as string[]).map((ds: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {ds}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Privacy */}
      {data.privacy && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Privacy</h4>
          <ul className="space-y-1">
            {(data.privacy as string[]).map((p: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pricing tiers */}
      {data.pricing_tiers && (
        <div className="grid gap-4 md:grid-cols-3">
          {(data.pricing_tiers as any[]).map((tier: any, i: number) => (
            <div
              key={i}
              className={`rounded-xl border p-5 ${
                tier.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="text-lg font-bold text-foreground">{tier.name}</div>
              <div className="mb-4 text-3xl font-bold text-foreground">
                {tier.price}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <ul className="mb-4 space-y-2">
                {(tier.features as string[]).map((f: string, j: number) => (
                  <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              {tier.cta && (
                <div className="text-center text-xs font-medium text-primary">
                  {tier.cta}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAM/SAM/SOM */}
      {data.tam && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "TAM", value: data.tam },
            { label: "SAM", value: data.sam },
            { label: "SOM", value: data.som },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border bg-card p-4 text-center"
            >
              <div className="text-lg font-bold text-foreground">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Advantages (why_now, unique_advantage) */}
      {data.advantages && (
        <div className="grid gap-4 md:grid-cols-2">
          {(data.advantages as any[]).map((adv: any, i: number) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-1 text-sm font-semibold text-foreground">
                {adv.title}
              </div>
              <div className="text-sm text-muted-foreground">{adv.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
