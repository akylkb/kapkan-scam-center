import { CrmScreen } from "@/components/crm/CrmScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat } from "@/lib/seat";

export default async function CrmPage({ searchParams }: PageProps<"/crm">) {
  const seat = parseSeat((await searchParams).seat);
  return (
    <SceneShell seat={seat}>
      <CrmScreen seat={seat} />
    </SceneShell>
  );
}
