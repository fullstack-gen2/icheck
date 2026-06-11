// import { getServerUser } from "@/auth-server";
import CreatingClassForm from "@/components/form/create_classes";
// import { redirect } from "next/navigation";

export default async function CreateClassPage() {
  // const user = await getServerUser();

  // if (user?.role !== "ADMIN") {
  //   redirect("/dashboard");
  // }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-7 lg:py-7">
      <div className="mb-6 space-y-1 sm:mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create Class</h1>
        <p className="text-sm text-muted-foreground">
          Add a new class, study shift, and date range.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 lg:p-8">
        <CreatingClassForm showHeader={false} />
      </div>
    </div>
  );
}
