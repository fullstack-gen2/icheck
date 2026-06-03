import ReportToday from "@/components/table/report_today";
import { backendFetch } from "@/lib/api-fetch";
import { Classroom, mockClassroom } from "@/lib/data/mockData/test-with-table/mock-table";

async function fetchClassroom(id: string): Promise<Classroom | null> {
  try {
    const res = await backendFetch(`/classrooms/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch { return null; }
}

export default async function CheckedAttendance({
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
                </div>
            </section>
            <section>
                <ReportToday />
            </section>
        </main>
    );
}
