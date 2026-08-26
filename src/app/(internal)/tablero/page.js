import { getObras, getObreros } from "@/lib/data/queries";
import Board from "./Board";

export default async function TableroPage() {
  const [obras, obreros] = await Promise.all([getObras(), getObreros()]);

  return <Board obras={obras} obreros={obreros} />;
}
