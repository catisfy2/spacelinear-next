import { TopicPage } from "@/views/Topic";

export default function TopicIdRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TopicPage />;
}
