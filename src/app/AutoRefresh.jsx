"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// La página pública suele quedar abierta todo el día en un teléfono/tablet
// compartido. Sin esto, se congela en el estado de cuando se abrió — hay
// que refrescarla sola para que los cambios del panel interno (y la fecha,
// si se cruza la medianoche) aparezcan sin que nadie tenga que recargar.
const INTERVAL_MS = 60_000;

export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
