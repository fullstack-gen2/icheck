"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ResetDeviceButton } from "@/components/reset-device-button";
import { useUser } from "@/components/user-provider";
import { UsersIcon, ChevronDownIcon, SearchIcon, XIcon, PlusIcon, LoaderCircleIcon } from "lucide-react";
import { useGetClassroomsQuery, type ClassroomDto } from "@/store/api/attendanceApi";
import { useCreateStudentMutation, useGetStudentsQuery } from "@/store/api/userApi";
import { useEnrollStudentMutation } from "@/store/api/enrollmentApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHIFTS = ["MORNING", "AFTERNOON", "EVENING"];
const SHIFT_LABEL: Record<string, string> = { MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening" };

// Course types visible under Scholarship program
const SCHOLARSHIP_COURSES = ["Fullstack", "Foundation", "Pre-Uni", "ITP", "ITE"];

export default function StudentsPage() {
  const user = useUser();
  const { data: students = [], isLoading: loadingStudents } = useGetStudentsQuery();
  const { data: classrooms = [], isLoading: loadingClassrooms } = useGetClassroomsQuery({ size: 1000 });
  const [createStudent, { isLoading: creatingStudent }] = useCreateStudentMutation();
  const [enrollStudent] = useEnrollStudentMutation();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    studentNo: "",
    gender: "",
    phone: "",
  });
  // A student can be registered into more than one class (Enrollment table).
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [programType, setProgramType] = useState<"ALL" | "BACHELOR" | "SCHOLARSHIP">("ALL");
  const [filterYear, setFilterYear]         = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterShift, setFilterShift]       = useState("");
  const [filterGeneration, setFilterGeneration] = useState("");
  const [filterCourse, setFilterCourse]     = useState(""); // scholarship only

  // Build class → metadata lookup
  const classMap = useMemo(() => {
    const m = new Map<string, ClassroomDto>();
    for (const c of classrooms) m.set(c.className, c);
    return m;
  }, [classrooms]);

  // Unique values for each filter dropdown
  const bachelorClassrooms = useMemo(() =>
    classrooms.filter((c) => c.programTypeName?.toUpperCase().includes("BACHELOR")), [classrooms]);
  const scholarshipClassrooms = useMemo(() =>
    classrooms.filter((c) => c.programTypeName?.toUpperCase().includes("SCHOLARSHIP")), [classrooms]);

  const years        = useMemo(() => [...new Set(bachelorClassrooms.map((c) => c.year).filter(Boolean))].sort() as number[], [bachelorClassrooms]);
  const semesters    = useMemo(() => [...new Set(bachelorClassrooms.map((c) => c.semester).filter(Boolean))].sort() as number[], [bachelorClassrooms]);
  const generations  = useMemo(() => [...new Set(
    (programType === "BACHELOR" ? bachelorClassrooms : scholarshipClassrooms)
      .map((c) => c.generation).filter(Boolean)
  )].sort() as number[], [programType, bachelorClassrooms, scholarshipClassrooms]);

  // Derive scholarship course from className (matches partial SCHOLARSHIP_COURSES name)
  function getCourse(className: string) {
    return SCHOLARSHIP_COURSES.find((c) => className?.toLowerCase().includes(c.toLowerCase())) ?? null;
  }

  // Filtered students
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const cls = classMap.get(s.className ?? "");

      // Program-type-specific filters
      if (programType === "BACHELOR") {
        if (!cls?.programTypeName?.toUpperCase().includes("BACHELOR")) return false;
        if (filterYear && String(cls?.year) !== filterYear) return false;
        if (filterSemester && String(cls?.semester) !== filterSemester) return false;
        if (filterShift && cls?.shift !== filterShift) return false;
        if (filterGeneration && String(cls?.generation) !== filterGeneration) return false;
      } else if (programType === "SCHOLARSHIP") {
        if (!cls?.programTypeName?.toUpperCase().includes("SCHOLARSHIP")) return false;
        if (filterCourse && !getCourse(s.className ?? "")?.toLowerCase().includes(filterCourse.toLowerCase())) return false;
        if (filterShift && cls?.shift !== filterShift) return false;
        if (filterGeneration && String(cls?.generation) !== filterGeneration) return false;
      }

      // Free-text search across name / studentNo / email / class
      if (q) {
        const haystack = [s.name, s.studentNo, s.email, s.className]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [students, classMap, search, programType, filterYear, filterSemester, filterShift, filterGeneration, filterCourse]);

  function resetFilters() {
    setFilterYear(""); setFilterSemester(""); setFilterShift("");
    setFilterGeneration(""); setFilterCourse("");
  }

  const isAdmin = user?.role === "ADMIN";
  const loading = loadingStudents || loadingClassrooms;

  function toggleClassroom(id: number) {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function submitRegisterStudent() {
    if (!registerForm.name.trim() || !registerForm.email.trim()) {
      toast.error("Student name and email are required.");
      return;
    }

    try {
      const created = await createStudent({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        studentNo: registerForm.studentNo.trim(),
        gender: registerForm.gender.trim(),
        phone: registerForm.phone.trim() || null,
        status: "ACTIVE",
        // Backend StudentRequest accepts an optional primary classId.
        classId: selectedClassIds[0] ?? null,
      }).unwrap();

      // A student can be registered into more than one class — enroll into
      // every selected classroom (Enrollment table, many-to-many).
      if (created?.id && selectedClassIds.length > 0) {
        setEnrolling(true);
        const results = await Promise.allSettled(
          selectedClassIds.map((classroomId) =>
            enrollStudent({ classroomId, userId: created.id }).unwrap()
          )
        );
        setEnrolling(false);
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast.error(`Student created, but failed to register ${failed} class${failed === 1 ? "" : "es"}.`);
        }
      }

      toast.success("Student registered.");
      setRegisterOpen(false);
      setRegisterForm({ name: "", email: "", studentNo: "", gender: "", phone: "" });
      setSelectedClassIds([]);
    } catch {
      toast.error("Could not register student.");
    }
  }

  return (
    <div className="px-4 sm:px-5 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Students</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{filtered.length} of {students.length}</span>
          {isAdmin && (
            <Button className="gap-1.5" onClick={() => setRegisterOpen(true)}>
              <PlusIcon className="size-4" />
              Register Student
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, student no., email, class…"
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted"
            aria-label="Clear search"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Program Type Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["ALL", "BACHELOR", "SCHOLARSHIP"] as const).map((pt) => (
          <button
            key={pt}
            onClick={() => { setProgramType(pt); resetFilters(); }}
            className={`px-4 py-1.5 rounded-full text-base font-medium transition-all border ${
              programType === pt
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {pt === "ALL" ? "All" : pt === "BACHELOR" ? "Bachelor" : "Scholarship"}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      {programType !== "ALL" && (
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Generation */}
          <FilterSelect
            label="Generation"
            value={filterGeneration}
            onChange={setFilterGeneration}
            options={generations.map((g) => ({ label: `Gen ${g}`, value: String(g) }))}
          />

          {programType === "BACHELOR" && (
            <>
              <FilterSelect
                label="Year"
                value={filterYear}
                onChange={setFilterYear}
                options={years.map((y) => ({ label: `Year ${y}`, value: String(y) }))}
              />
              <FilterSelect
                label="Semester"
                value={filterSemester}
                onChange={setFilterSemester}
                options={semesters.map((s) => ({ label: `Sem ${s}`, value: String(s) }))}
              />
            </>
          )}

          {programType === "SCHOLARSHIP" && (
            <FilterSelect
              label="Course"
              value={filterCourse}
              onChange={setFilterCourse}
              options={SCHOLARSHIP_COURSES.map((c) => ({ label: c, value: c }))}
            />
          )}

          <FilterSelect
            label="Shift"
            value={filterShift}
            onChange={setFilterShift}
            options={SHIFTS.map((s) => ({ label: SHIFT_LABEL[s], value: s }))}
          />

          {(filterYear || filterSemester || filterShift || filterGeneration || filterCourse) && (
            <Button variant="ghost" size="sm" className="text-muted-foreground/70 hover:text-muted-foreground" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground/70">Loading students…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/70 bg-card rounded-2xl border border-border">
          <UsersIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No students match your filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Student No.</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                {isAdmin && (
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Device</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, index) => (
                <tr
                  key={student.id}
                  className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${
                    index === filtered.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{student.name}</div>
                    <div className="text-sm text-muted-foreground/70">{student.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {student.className ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-sm text-muted-foreground sm:table-cell">
                    {student.studentNo ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        student.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }
                    >
                      {student.status ?? "—"}
                    </Badge>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <ResetDeviceButton studentId={student.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register Student</DialogTitle>
            <DialogDescription>
              Create a student account from live API data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={registerForm.name}
              onChange={(event) => setRegisterForm((form) => ({ ...form, name: event.target.value }))}
              placeholder="Full name"
            />
            <Input
              value={registerForm.email}
              onChange={(event) => setRegisterForm((form) => ({ ...form, email: event.target.value }))}
              placeholder="Email"
              type="email"
            />
            <Input
              value={registerForm.studentNo}
              onChange={(event) => setRegisterForm((form) => ({ ...form, studentNo: event.target.value }))}
              placeholder="Student number"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={registerForm.gender}
                onChange={(event) => setRegisterForm((form) => ({ ...form, gender: event.target.value }))}
                placeholder="Gender"
              />
              <Input
                value={registerForm.phone}
                onChange={(event) => setRegisterForm((form) => ({ ...form, phone: event.target.value }))}
                placeholder="Phone"
              />
            </div>

            {/* A student can be registered into more than one class. */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Classes ({selectedClassIds.length} selected)
              </p>
              <div className="max-h-40 overflow-y-auto rounded-lg border divide-y divide-border/50">
                {classrooms.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground/70">No classes available.</p>
                ) : (
                  classrooms.map((c) => (
                    <label
                      key={c.id}
                      htmlFor={`reg-class-${c.id}`}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`reg-class-${c.id}`}
                        checked={selectedClassIds.includes(c.id)}
                        onCheckedChange={() => toggleClassroom(c.id)}
                      />
                      <span className="text-sm">
                        {c.className}
                        <span className="ml-1.5 text-xs text-muted-foreground/70 font-mono">{c.classCode}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRegisterStudent} disabled={creatingStudent || enrolling} className="gap-1.5">
              {(creatingStudent || enrolling) ? <LoaderCircleIcon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
              {enrolling ? "Enrolling…" : "Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Reusable filter select ──────────────────────────────────────────────────
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-1.5 text-base rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          value
            ? "border-primary bg-primary/5 text-primary font-medium"
            : "border-border bg-card text-muted-foreground"
        }`}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
    </div>
  );
}
