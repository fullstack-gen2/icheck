import { ClassCard } from "@/components/ui/class-card";

export default function AdminDashboard() {
  return (
    <div className="px-5 py-8">
      <div className="mx-auto w-full">
        {/* Title */}
        <h1 className="mb-8 w-full pr-5 text-3xl font-bold text-black">
          Class Info
        </h1>

        {/* Cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
          {Array.from({ length: 20 }).map((_, index) => (
            <ClassCard
              key={index}
              title="Full Stack"
              classNameValue="Data Analyze"
              shift="Morning"
              time="8:00AM - 12:00AM"
              students="11/5"
              code={`00${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
