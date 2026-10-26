import { SeatRedirect } from "@/components/shared/SeatRedirect";

/** Старый адрес /vishing?seat=N — уводит на /vishing/N/ */
export default function VishingRedirect() {
  return <SeatRedirect screen="vishing" />;
}
