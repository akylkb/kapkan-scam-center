import { VictimScreen } from "@/components/victim/VictimScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat, seatStaticParams } from "@/lib/seat";

/** Каждое место — отдельный готовый HTML: /victim/1/ … /victim/99/ */
export const generateStaticParams = seatStaticParams;

export default async function VictimPage({ params }: PageProps<"/victim/[seat]">) {
  const seat = parseSeat((await params).seat);
  return (
    <SceneShell seat={seat} sender="victim">
      <VictimScreen seat={seat} />
    </SceneShell>
  );
}
