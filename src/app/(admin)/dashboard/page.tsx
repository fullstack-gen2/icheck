import { getServerUser } from "@/auth-server";
import { AdminDashboard } from "@/components/admin-dashboard";

export default async function DashboardPage() {
  const user = await getServerUser();
  const role = user?.role ?? "ADMIN";
  const userId = user?.id ?? "";
  const isTeacher = role === "TEACHER";

  // Teacher → analytics scoped to their classes; Admin → school-wide.
  // (The class-card overview moved to the "Classes" page in the sidebar.)
  return isTeacher ? (
    <AdminDashboard teacherId={Number(userId)} heading="Teacher Dashboard" />
  ) : (
    <AdminDashboard heading="Admin Dashboard" />
  );
}
