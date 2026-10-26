import { SeatRedirect } from "@/components/shared/SeatRedirect";

/** Старый адрес /desk?seat=N — уводит на /desk/N/ */
export default function DeskRedirect() {
  return <SeatRedirect screen="desk" />;
}
