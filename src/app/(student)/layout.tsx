import { getServerUser } from "@/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  // Non-students should not access student routes.
  if (user && user.role !== "STUDENT") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#273C97] text-white px-6 py-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white p-1">
          <Logo size={24} />
        </div>
        <span className="text-xl font-semibold">i-Check</span>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name ?? ""}</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
