import { SeatRedirect } from "@/components/shared/SeatRedirect";

/** Старый адрес /chat?seat=N — уводит на /chat/N/ */
export default function ChatRedirect() {
  return <SeatRedirect screen="chat" />;
}
