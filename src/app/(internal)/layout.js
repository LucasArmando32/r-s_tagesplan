import { requireAdmin } from "@/lib/auth/guard";
import NavBar from "./NavBar";

export default async function InternalLayout({ children }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
