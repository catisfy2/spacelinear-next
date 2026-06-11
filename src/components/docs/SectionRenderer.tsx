"use client";

import { MarkdownBlock } from "./renderers/MarkdownBlock";
import { FeatureMatrixBlock } from "./renderers/FeatureMatrixBlock";
import { MermaidBlock } from "./renderers/MermaidBlock";
import { TechStackBlock } from "./renderers/TechStackBlock";
import { ApiTableBlock } from "./renderers/ApiTableBlock";
import { RoadmapBlock } from "./renderers/RoadmapBlock";
import { DataFlowBlock } from "./renderers/DataFlowBlock";
import { MetricsBlock } from "./renderers/MetricsBlock";

interface SectionRendererProps {
  content: any;
  slug?: string;
}

export function SectionRenderer({ content, slug }: SectionRendererProps) {
  if (!content) return null;

  // Determine content type from shape of data
  const contentType = detectContentType(content, slug);

  switch (contentType) {
    case "feature_matrix":
      return <FeatureMatrixBlock data={content} />;
    case "mermaid":
      return <MermaidBlock data={content} />;
    case "tech_stack":
      return <TechStackBlock data={content} />;
    case "api_table":
      return <ApiTableBlock data={content} />;
    case "roadmap":
      return <RoadmapBlock data={content} />;
    case "data_flow":
      return <DataFlowBlock data={content} />;
    case "metrics":
      return <MetricsBlock data={content} />;
    case "markdown":
    default:
      return <MarkdownBlock data={content} />;
  }
}

function detectContentType(content: any, slug?: string): string {
  if (slug === "feature_matrix" || content?.categories) return "feature_matrix";
  if (slug === "tech_stack" || content?.frontend || content?.backend) return "tech_stack";
  if (slug === "api_docs" || content?.internal_apis) return "api_table";
  if (slug === "roadmap" || content?.short_term) return "roadmap";
  if (slug === "data_flow" || content?.steps) return "data_flow";
  if (slug === "architecture" || content?.layers) return "mermaid";
  if (slug === "performance" || slug === "analytics" || content?.kpis) return "metrics";
  return "markdown";
}
