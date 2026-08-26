import { getObras } from "@/lib/data/queries";
import ObrasManager from "./ObrasManager";

export default function ObrasPage() {
  const obras = getObras({ includeInactive: true });
  return <ObrasManager obras={obras} />;
}
