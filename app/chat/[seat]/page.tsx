import { ChatScreen } from "@/components/chat/ChatScreen";
import { SceneShell } from "@/components/shared/SceneShell";
import { parseSeat } from "@/lib/seat";

export default async function ChatPage({ searchParams }: PageProps<"/chat">) {
  const seat = parseSeat((await searchParams).seat);
  return (
    <SceneShell seat={seat}>
      <ChatScreen seat={seat} />
    </SceneShell>
  );
}
