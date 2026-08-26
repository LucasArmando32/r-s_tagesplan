import { getObreros, getObras } from "@/lib/data/queries";
import ObrerosManager from "./ObrerosManager";

export default function ObrerosPage() {
  const obreros = getObreros({ includeInactive: true });
  const obras = getObras();

  return <ObrerosManager obreros={obreros} obras={obras} />;
}
