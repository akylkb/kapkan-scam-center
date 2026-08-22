import { SceneShell } from "@/components/shared/SceneShell";
import { WallScreen } from "@/components/wall/WallScreen";

export default function WallPage() {
  // Экран на стену один на всю площадку, поэтому место фиксировано
  return (
    <SceneShell seat={1}>
      <WallScreen />
    </SceneShell>
  );
}
