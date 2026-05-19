export default function AttendanceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="px-5 py-8">
      <h1 className="text-3xl font-bold text-black mb-4">
        Attendance #{params.id}
      </h1>
    </div>
  );
}
