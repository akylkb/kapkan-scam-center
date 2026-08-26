import { DropsScreen } from "@/components/drops/DropsScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat } from "@/lib/seat";

export default async function DropsPage({ searchParams }: PageProps<"/drops">) {
  const seat = parseSeat((await searchParams).seat);
  return (
    <SceneShell seat={seat}>
      <DropsScreen seat={seat} />
    </SceneShell>
  );
}
