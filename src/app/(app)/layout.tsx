import { AuthGate } from "../AuthGate";
import { AppLayoutClient } from "./AppLayoutClient";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <AppLayoutClient>{children}</AppLayoutClient>
    </AuthGate>
  );
}
