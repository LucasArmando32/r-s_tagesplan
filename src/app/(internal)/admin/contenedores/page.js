import { getContenedores, getObras } from "@/lib/data/queries";
import ContenedoresManager from "./ContenedoresManager";

export default async function ContenedoresPage() {
  const [contenedores, obras] = await Promise.all([
    getContenedores(),
    getObras(),
  ]);

  return <ContenedoresManager contenedores={contenedores} obras={obras} />;
}
