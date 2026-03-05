import { SubjectPage } from "@/views/Subject";

export default function SubjectIdRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <SubjectPage />;
}
