import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";

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
        {/* Logo on a light pill so the dark-on-blue SVG stays readable. */}
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white p-1">
          <Logo size={24} />
        </div>
        <span className="text-xl font-semibold">i-Check</span>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm opacity-90">{session.user.name}</span>
          {/* NextAuth signout endpoint lives under the /attendance basePath
              and we want to land on /attendance/login afterwards. */}
          <a
            href="/attendance/api/auth/signout?callbackUrl=/attendance/login"
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
