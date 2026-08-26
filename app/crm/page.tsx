import { SeatRedirect } from "@/components/shared/SeatRedirect";

/** Старый адрес /crm?seat=N — уводит на /crm/N/ */
export default function CrmRedirect() {
  return <SeatRedirect screen="crm" />;
}
