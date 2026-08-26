import { DropsScreen } from "@/components/drops/DropsScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat, seatStaticParams } from "@/lib/seat";

/** Каждое место — отдельный готовый HTML: /drops/1/ … /drops/99/ */
export const generateStaticParams = seatStaticParams;

export default async function DropsPage({ params }: PageProps<"/drops/[seat]">) {
  const seat = parseSeat((await params).seat);
  return (
    <SceneShell seat={seat}>
      <DropsScreen seat={seat} />
    </SceneShell>
  );
}
