import { SeatRedirect } from "@/components/shared/SeatRedirect";

/** Совместимость со старыми ярлыками вида /victim?seat=7 */
export default function VictimRedirect() {
  return <SeatRedirect screen="victim" />;
}
