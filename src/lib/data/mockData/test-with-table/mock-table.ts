import { AttendanceList } from "@/types/attendance";

export interface Classroom {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: string;
  academicYear: number;
  startDate: string;
  endDate: string;
  status: boolean;
}

export const mockClassroom: Classroom = {
  id: 1,
  className: "Bachelor",
  classCode: "A001",
  programTypeName: "Bachelor",
  generation: 1,
  year: 1,
  semester: 1,
  shift: "MORNING",
  academicYear: 2026,
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  status: true,
};

export const mockAttendanceData: AttendanceList[] = [
  {
    order: 1,
    id: "INV001",
    profile:
      "https://i.pinimg.com/736x/25/60/e1/2560e1cbf27a9cfa78faccde40971482.jpg",
    name: "Chan Thorn",
    gender: "Male",
    phoneNumber: "(555) 214-9087",
    dateOfBirth: "2002-04-17",
    status: "pending",
  },
  {
    order: 2,
    id: "INV002",
    profile:
      "https://i.pinimg.com/1200x/90/74/a6/9074a68f86e0f006a9ec7183530e66c0.jpg",
    name: "Dara",
    gender: "Male",
    phoneNumber: "(555) 673-1204",
    dateOfBirth: "2001-11-29",
    status: "pending",
  },
  {
    order: 3,
    id: "INV003",
    profile:
      "https://i.pinimg.com/736x/5f/79/ea/5f79eae006365020a1cf50534a1b4314.jpg",
    name: "Sokha",
    gender: "Female",
    phoneNumber: "(555) 398-4412",
    dateOfBirth: "2003-07-08",
    status: "present",
  },
  {
    order: 4,
    id: "INV004",
    profile:
      "https://i.pinimg.com/1200x/75/42/fe/7542fec761bbb72957ccae0839476c4a.jpg",
    name: "Nita",
    gender: "Female",
    phoneNumber: "(555) 887-2301",
    dateOfBirth: "2002-01-14",
    status: "late",
  },
  {
    order: 5,
    id: "INV005",
    profile:
      "https://i.pinimg.com/736x/12/d9/b4/12d9b479ee8cb5200d7d285e27408d5f.jpg",
    name: "Sreypov",
    gender: "Female",
    phoneNumber: "(555) 542-7769",
    dateOfBirth: "2004-09-03",
    status: "present",
  },
];