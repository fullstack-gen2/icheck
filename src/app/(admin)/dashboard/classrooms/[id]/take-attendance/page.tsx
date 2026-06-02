import AttendanceCheckingList from "@/components/table/check_attendance";
import { backendFetch } from "@/lib/api-fetch";
import { Classroom, mockClassroom } from "@/lib/data/mockData/test-with-table/mock-table";
import Link from "next/link";
import { AiOutlineQrcode } from "react-icons/ai";


async function fetchClassroom(id: string): Promise<Classroom | null> {
  try {
    const res = await backendFetch(`/classrooms/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch { return null; }
}

export default async function TakeAttendance({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const classroom = (await fetchClassroom(id)) ?? mockClassroom;
    return (
        <main className="px-7 py-7">
            <section className="mx-auto mb-2 w-full flex justify-between">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-col">
                  <h1 className="mb-3 text-3xl font-semibold tracking-tight text-black dark:text-white">
                    {classroom.className}
                  </h1>
                  <h2 className="text-2xl leading-tight text-black dark:text-white">
                    បញ្ជីរាយវត្តមានសិស្ស-Student Attendance List-Today
                  </h2>
                </div>
        </div>
        <div className="flex justify-between">     
          <Link href={`/admin/dashboard/classrooms/${id}/take-attendance/qr-code`} className="flex items-center gap-2 rounded-md border border-gray-300 bg-white dark:bg-black px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <AiOutlineQrcode className="size-20  text-black dark:text-white" />
          </Link>

          {/* <AlertDialogDemo
              btnName="Start Session"
              title="Start Session Now"
              firstTime="8:00"
              secondTime="12:00"
              id={id}/> */}
        </div>
      </section>
            <section>
                <AttendanceCheckingList />
            </section>
        </main>
    )
}