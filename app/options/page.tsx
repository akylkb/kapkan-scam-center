import { OptionsScreen } from "@/components/options/OptionsScreen";
import { SceneShell } from "@/components/shared/SceneShell";

/** Адрес без номера этапа открывает первый: новый счёт, пополнение */
export default function OptionsIndex() {
  return (
    <SceneShell seat={1}>
      <OptionsScreen actId={1} />
    </SceneShell>
  );
}
