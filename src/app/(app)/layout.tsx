import { AuthGate } from "../AuthGate";
import { DataLoader } from "../DataLoader";
import { AppShell } from "@/components/shell/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <DataLoader>
        <AppShell>{children}</AppShell>
      </DataLoader>
    </AuthGate>
  );
}
