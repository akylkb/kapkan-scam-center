import { ChatScreen } from "@/components/chat/ChatScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat, seatStaticParams } from "@/lib/seat";

/** Каждое место — отдельный готовый HTML: /chat/1/ … /chat/99/ */
export const generateStaticParams = seatStaticParams;

export default async function ChatPage({ params }: PageProps<"/chat/[seat]">) {
  const seat = parseSeat((await params).seat);
  return (
    <SceneShell seat={seat}>
      <ChatScreen seat={seat} />
    </SceneShell>
  );
}
