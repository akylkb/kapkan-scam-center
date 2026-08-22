import { SceneShell } from "@/components/shared/SceneShell";
import { AdminScreen } from "@/components/admin/AdminScreen";

export default function AdminPage() {
  return (
    <SceneShell seat={1}>
      <AdminScreen />
    </SceneShell>
  );
}
