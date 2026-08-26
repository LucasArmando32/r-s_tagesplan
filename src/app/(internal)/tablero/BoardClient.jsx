"use client";

import dynamic from "next/dynamic";

// @dnd-kit genera ids internos (aria-describedby) con un contador que no es
// estable entre el render de servidor y el de cliente — sin ssr:false,
// React reporta un hydration mismatch. El tablero es una pantalla interna
// (requiere login) sin necesidad real de SSR, así que se carga solo en el
// navegador.
const Board = dynamic(() => import("./Board"), { ssr: false });

export default function BoardClient(props) {
  return <Board {...props} />;
}
