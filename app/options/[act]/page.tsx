import { OptionsDown } from "@/components/options/OptionsDown";
import { OptionsScreen } from "@/components/options/OptionsScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { OPTION_ACTS, optionStaticParams, type OptionActId } from "@/lib/fixtures/options";

/** Каждый этап сцены — отдельный готовый HTML: /options/1/ … /options/4/ */
export const generateStaticParams = optionStaticParams;

export default async function OptionsPage({ params }: PageProps<"/options/[act]">) {
  const act = Number((await params).act);

  // Этап 4 — сайта больше нет. Движок сцены сюда не подключён намеренно:
  // тревога или вспышка с соседней машины не должна «оживить» мёртвую страницу
  if (!(act in OPTION_ACTS)) return <OptionsDown />;

  return (
    <SceneShell seat={1}>
      <OptionsScreen actId={act as OptionActId} />
    </SceneShell>
  );
}
