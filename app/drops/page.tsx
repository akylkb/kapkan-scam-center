import { SeatRedirect } from "@/components/shared/SeatRedirect";

/** Старый адрес /drops?seat=N — уводит на /drops/N/ */
export default function DropsRedirect() {
  return <SeatRedirect screen="drops" />;
}
