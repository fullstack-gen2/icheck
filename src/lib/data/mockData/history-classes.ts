export type HistoryAttendanceStatus = "PRESENT" | "LATE" | "PERMISSION";

export interface HistoryClassroom {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: "MORNING" | "AFTERNOON" | "EVENING";
  academicYear: number;
  startDate: string;
  endDate: string;
  lab: string;
  teacherName: string;
  status: false;
}

export interface HistoryAttendance {
  date: string;
  session: string;
  checkInTime: string;
  status: HistoryAttendanceStatus;
  remark: string;
}

export interface HistoryStudent {
  id: number;
  studentNo: string;
  name: string;
  gender: "M" | "F";
  email: string;
  phone: string;
  status: "COMPLETED";
  attendances: HistoryAttendance[];
}

const classes: HistoryClassroom[] = [
  {
    id: 9001,
    className: "Pre-University Gen 2 Morning",
    classCode: "PREU-G2-M",
    programTypeName: "Pre-University",
    generation: 2,
    year: null,
    semester: null,
    shift: "MORNING",
    academicYear: 2026,
    startDate: "2026-01-06",
    endDate: "2026-03-28",
    lab: "Lab Fullstack",
    teacherName: "Teacher One",
    status: false,
  },
  {
    id: 9002,
    className: "Foundation Gen 2 Afternoon",
    classCode: "FND-G2-A",
    programTypeName: "Foundation",
    generation: 2,
    year: null,
    semester: null,
    shift: "AFTERNOON",
    academicYear: 2026,
    startDate: "2026-02-03",
    endDate: "2026-04-30",
    lab: "Lab AI",
    teacherName: "Chan Chhaya",
    status: false,
  },
  {
    id: 9003,
    className: "Fullstack Gen 2 Morning",
    classCode: "FS-G2-M",
    programTypeName: "Fullstack",
    generation: 2,
    year: null,
    semester: null,
    shift: "MORNING",
    academicYear: 2026,
    startDate: "2026-01-13",
    endDate: "2026-05-31",
    lab: "Lab DevOps",
    teacherName: "Teacher One",
    status: false,
  },
  {
    id: 9004,
    className: "ITP Gen 2 Morning",
    classCode: "ITP-G2-M",
    programTypeName: "IT Professional",
    generation: 2,
    year: null,
    semester: null,
    shift: "MORNING",
    academicYear: 2026,
    startDate: "2026-02-10",
    endDate: "2026-05-20",
    lab: "Lab Data Analytics",
    teacherName: "Chan Chhaya",
    status: false,
  },
  {
    id: 9005,
    className: "ITP Gen 2 Evening",
    classCode: "ITP-G2-E",
    programTypeName: "IT Professional",
    generation: 2,
    year: null,
    semester: null,
    shift: "EVENING",
    academicYear: 2026,
    startDate: "2026-02-10",
    endDate: "2026-05-20",
    lab: "Lab BlockChain",
    teacherName: "Teacher Two",
    status: false,
  },
];

const names = [
  ["Sok Dara", "M"],
  ["Chan Vichka", "M"],
  ["Srey Nita", "F"],
  ["Kim Sopheak", "M"],
  ["Long Malis", "F"],
  ["Heng Rithy", "M"],
  ["Ny Sreypov", "F"],
  ["Chea Piseth", "M"],
  ["Sokha Lina", "F"],
  ["Vannak Visal", "M"],
] as const;

const dates = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06"];

function statusFor(classIndex: number, studentIndex: number, dateIndex: number): HistoryAttendanceStatus {
  const code = (classIndex * 3 + studentIndex + dateIndex) % 10;
  if (code === 0 || code === 6) return "LATE";
  if (code === 3) return "PERMISSION";
  return "PRESENT";
}

function timeFor(status: HistoryAttendanceStatus, shift: HistoryClassroom["shift"]) {
  if (status === "PERMISSION") return "-";
  if (shift === "EVENING") return status === "LATE" ? "18:12" : "18:00";
  if (shift === "AFTERNOON") return status === "LATE" ? "13:42" : "13:30";
  return status === "LATE" ? "08:12" : "08:00";
}

function remarkFor(status: HistoryAttendanceStatus) {
  if (status === "LATE") return "Traffic on the way to campus";
  if (status === "PERMISSION") return "Approved permission request";
  return "On time";
}

const studentsByClassId = Object.fromEntries(
  classes.map((classroom, classIndex) => [
    classroom.id,
    names.map(([name, gender], studentIndex) => {
      const id = classroom.id * 100 + studentIndex + 1;
      const attendances = dates.map((date, dateIndex) => {
        const status = statusFor(classIndex, studentIndex, dateIndex);
        return {
          date,
          session: `${classroom.classCode} Session ${dateIndex + 1}`,
          checkInTime: timeFor(status, classroom.shift),
          status,
          remark: remarkFor(status),
        };
      });

      return {
        id,
        studentNo: `ISTAD-G2-${String(classIndex + 1).padStart(2, "0")}${String(studentIndex + 1).padStart(2, "0")}`,
        name,
        gender,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@student.istad.kh`,
        phone: `+855 9${classIndex}${studentIndex} ${String(120000 + classIndex * 1000 + studentIndex * 37).slice(0, 6)}`,
        status: "COMPLETED" as const,
        attendances,
      };
    }),
  ])
) as Record<number, HistoryStudent[]>;

export function getHistoryClasses() {
  return classes;
}

export function getHistoryClassById(id: number) {
  return classes.find((classroom) => classroom.id === id) ?? null;
}

export function getHistoryStudentsByClassId(id: number) {
  return studentsByClassId[id] ?? [];
}

export function getHistoryClassCounts() {
  return Object.fromEntries(
    classes.map((classroom) => {
      const students = getHistoryStudentsByClassId(classroom.id);
      return [
        classroom.className,
        {
          total: students.length,
          female: students.filter((student) => student.gender === "F").length,
        },
      ];
    })
  );
}

export function getHistoryAttendanceTotals(students: HistoryStudent[]) {
  return students.flatMap((student) => student.attendances).reduce(
    (acc, attendance) => {
      acc[attendance.status] += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, PRESENT: 0, LATE: 0, PERMISSION: 0 }
  );
}
