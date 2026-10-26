import { VishingScreen } from "@/components/vishing/VishingScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat, seatStaticParams } from "@/lib/seat";

/** Каждое место — отдельный готовый HTML: /vishing/1/ … /vishing/99/ */
export const generateStaticParams = seatStaticParams;

export default async function VishingPage({ params }: PageProps<"/vishing/[seat]">) {
  const seat = parseSeat((await params).seat);
  return (
    <SceneShell seat={seat}>
      <VishingScreen seat={seat} />
    </SceneShell>
  );
}
