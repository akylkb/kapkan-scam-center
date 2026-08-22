import { SceneShell } from "@/components/shared/SceneShell";
import { ClientScreen } from "@/components/client/ClientScreen";

export default function ClientPage() {
  return (
    <SceneShell seat={1}>
      <ClientScreen />
    </SceneShell>
  );
}
