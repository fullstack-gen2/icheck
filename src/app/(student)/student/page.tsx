import { auth } from "@/auth";

export default async function StudentHomePage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session?.user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          Scan a QR code or check your attendance record below.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Check In
          </h2>
          <p className="text-sm text-gray-500">
            Use your device to scan the QR code shown in class.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            My Attendance
          </h2>
          <p className="text-sm text-gray-500">
            View your attendance history and status.
          </p>
        </div>
      </div>
    </div>
  );
}
