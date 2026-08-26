import { getObras, getObreros } from "@/lib/data/queries";
import BoardClient from "./BoardClient";

export default function TableroPage() {
  const obras = getObras();
  const obreros = getObreros();

  return <BoardClient obras={obras} obreros={obreros} />;
}
