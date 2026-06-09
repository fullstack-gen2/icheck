import ReportToday from "@/components/table/report_today";
import { Button } from "@/components/ui/button";
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
                <div className="flex-col">
                  <Button className="bg-primary p-5" type="button">
                    Amendment
                  </Button>
                </div>
            </section>
            <section>
                <ReportToday />
                <aside className="mt-4 max-w-md w-87.5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 my-font dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <p className="border-b border-slate-200 pb-1 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">Note</p>
                  <ul className="space-y-1 mt-2 pl-3 list-disc">
                    <li className="ml-4">
                      <span className="font-semibold">P</span> stands for Present.
                    </li>
                    <li className="ml-4">
                      <span className="font-semibold">PM</span> stands for Permission.
                    </li>
                    <li className="ml-4">
                      <span className="font-semibold">L</span> stands for Late.
                    </li>
                  </ul>
                </aside>
            </section>
        </main>
    );
}
