import { auth } from "@/auth";
import { ResetDeviceButton } from "@/components/reset-device-button";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

interface Student {
  id: number;
  studentNo: string;
  name: string;
  gender: string;
  email: string;
  phone: string | null;
  className: string;
  status: string;
  deviceId?: string | null;
}

async function fetchStudents(): Promise<Student[]> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/users/students?size=100`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json?.payload?.content ?? [];
  } catch {
    return [];
  }
}

export default async function StudentsPage() {
  const session = await auth();
  const students = await fetchStudents();

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-black">Students</h1>
        <span className="text-sm text-gray-500">{students.length} students</span>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Class</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Student No.</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              {(session?.user?.role === "ADMIN") && (
                <th className="text-right px-4 py-3 font-medium text-gray-600">Device</th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr
                  key={student.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === students.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-400">{student.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {student.className ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell font-mono text-xs">
                    {student.studentNo}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={student.status === "ACTIVE" ? "default" : "secondary"}
                      className={
                        student.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : ""
                      }
                    >
                      {student.status}
                    </Badge>
                  </td>
                  {(session?.user?.role === "ADMIN") && (
                    <td className="px-4 py-3 text-right">
                      <ResetDeviceButton studentId={student.id} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
