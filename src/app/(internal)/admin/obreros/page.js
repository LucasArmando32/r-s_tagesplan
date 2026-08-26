import { getObreros, getObras } from "@/lib/data/queries";
import ObrerosManager from "./ObrerosManager";

export default async function ObrerosPage() {
  const [obreros, obras] = await Promise.all([
    getObreros({ includeInactive: true }),
    getObras(),
  ]);

  return <ObrerosManager obreros={obreros} obras={obras} />;
}
