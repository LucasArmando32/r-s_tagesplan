import { getContenedores, getObras } from "@/lib/data/queries";
import ContenedoresManager from "./ContenedoresManager";

export default function ContenedoresPage() {
  const contenedores = getContenedores();
  const obras = getObras();

  return <ContenedoresManager contenedores={contenedores} obras={obras} />;
}
