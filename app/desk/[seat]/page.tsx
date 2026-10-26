import { DesktopScreen } from "@/components/desk/DesktopScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat, seatStaticParams } from "@/lib/seat";

/** Каждое место — отдельный готовый HTML: /desk/1/ … /desk/99/ */
export const generateStaticParams = seatStaticParams;

export default async function DeskPage({ params }: PageProps<"/desk/[seat]">) {
  const seat = parseSeat((await params).seat);
  return (
    <SceneShell seat={seat}>
      <DesktopScreen seat={seat} />
    </SceneShell>
  );
}
