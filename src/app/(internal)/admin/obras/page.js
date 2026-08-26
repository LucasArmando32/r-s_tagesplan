import { getObras } from "@/lib/data/queries";
import ObrasManager from "./ObrasManager";

export default async function ObrasPage() {
  const obras = await getObras({ includeInactive: true });
  return <ObrasManager obras={obras} />;
}
