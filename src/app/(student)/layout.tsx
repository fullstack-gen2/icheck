import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#273C97] text-white px-6 py-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#273C97] font-bold text-sm">
          iC
        </div>
        <span className="text-xl font-semibold">i-Check</span>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm opacity-90">{session.user.name}</span>
          <a
            href="/api/auth/signout"
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
