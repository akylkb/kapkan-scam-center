import { CrmScreen } from "@/components/crm/CrmScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat, seatStaticParams } from "@/lib/seat";

/** Каждое место — отдельный готовый HTML: /crm/1/ … /crm/99/ */
export const generateStaticParams = seatStaticParams;

export default async function CrmPage({ params }: PageProps<"/crm/[seat]">) {
  const seat = parseSeat((await params).seat);
  return (
    <SceneShell seat={seat}>
      <CrmScreen seat={seat} />
    </SceneShell>
  );
}
