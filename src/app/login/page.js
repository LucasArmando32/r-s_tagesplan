import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const next = typeof params?.next === "string" ? params.next : "/tablero";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <LoginForm next={next} />
    </main>
  );
}
