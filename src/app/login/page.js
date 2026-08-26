import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/tablero");
  }

  const params = await searchParams;
  const next = typeof params?.next === "string" ? params.next : "/tablero";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <LoginForm next={next} />
    </main>
  );
}
