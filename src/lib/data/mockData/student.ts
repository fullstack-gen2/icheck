import { AttendanceStatus, Student } from "@/types/student";

export const data: Student[] = [
  {
    id: "INV001",
    profile:
      "https://i.pinimg.com/736x/25/60/e1/2560e1cbf27a9cfa78faccde40971482.jpg",
    name: "Chan Thorn",
    gender: "Male",
    phone: "(555) 214-9087",
    dateOfBirth: "2002-04-17",
    status: AttendanceStatus.PENDING,
  },
  {
    id: "INV002",
    profile:
      "https://i.pinimg.com/1200x/90/74/a6/9074a68f86e0f006a9ec7183530e66c0.jpg",
    name: "Dara",
    gender: "Male",
    phone: "(555) 673-1204",
    dateOfBirth: "2001-11-29",
    status: AttendanceStatus.PENDING,
  },
  {
    id: "INV003",
    profile:
      "https://i.pinimg.com/736x/5f/79/ea/5f79eae006365020a1cf50534a1b4314.jpg",
    name: "Sokha",
    gender: "Female",
    phone: "(555) 398-4412",
    dateOfBirth: "2003-07-08",
    status: AttendanceStatus.PRESENT,
  },
  {
    id: "INV004",
    profile:
      "https://i.pinimg.com/1200x/75/42/fe/7542fec761bbb72957ccae0839476c4a.jpg",
    name: "Nita",
    gender: "Female",
    phone: "(555) 887-2301",
    dateOfBirth: "2002-01-14",
    status: AttendanceStatus.LATE,
  },
  {
    id: "INV005",
    profile:
      "https://i.pinimg.com/736x/12/d9/b4/12d9b479ee8cb5200d7d285e27408d5f.jpg",
    name: "Nita",
    gender: "Female",
    phone: "(555) 542-7769",
    dateOfBirth: "2004-09-03",
    status: AttendanceStatus.PRESENT,
  },
  {
    id: "INV006",
    profile:
      "https://i.pinimg.com/736x/1f/6f/96/1f6f96ca0f77825a13311189a8267457.jpg",
    name: "Vanna",
    gender: "Female",
    phone: "(555) 601-3482",
    dateOfBirth: "2003-02-25",
    status: AttendanceStatus.PENDING,
  },
  {
    id: "INV007",
    profile:
      "https://i.pinimg.com/736x/57/09/e1/5709e19578b9f0617d3e731cd4139c81.jpg",
    name: "Piseth",
    gender: "Male",
    phone: "(555) 742-1198",
    dateOfBirth: "2001-08-12",
    status: AttendanceStatus.PRESENT,
  },
  {
    id: "INV008",
    profile:
      "https://i1-c.pinimg.com/1200x/ea/c9/95/eac99520f99c561fb9b3bc1fc70c8432.jpg",
    name: "Malis",
    gender: "Female",
    phone: "(555) 855-6671",
    dateOfBirth: "2002-10-06",
    status: AttendanceStatus.LATE,
  },
  {
    id: "INV009",
    profile:
      "https://i.pinimg.com/736x/24/68/88/24688843903c8e0e07c8d0e4e0309781.jpg",
    name: "Rithy",
    gender: "Male",
    phone: "(555) 930-4025",
    dateOfBirth: "2000-12-19",
    status: AttendanceStatus.PENDING,
  },
  {
    id: "INV010",
    profile:
      "https://i.pinimg.com/736x/0a/1c/83/0a1c8318000d3b08a9ab8bf7b883c032.jpg",
    name: "Sreypov",
    gender: "Female",
    phone: "(555) 483-2560",
    dateOfBirth: "2004-05-30",
    status: AttendanceStatus.PRESENT,
  },
  {
    id: "INV011",
    profile:
      "https://i.pinimg.com/736x/29/87/f0/2987f0f43e83dedc07f28ccabc25b410.jpg",
    name: "Kosal",
    gender: "Male",
    phone: "(555) 517-9044",
    dateOfBirth: "2002-03-14",
    status: AttendanceStatus.LATE,
  },
];

export const studentProfileInfo = {
  username: "Pisoth",
  email: "Pisoth@student.istad.kh",
  information: [
    {
      label: "honorific",
      value: "None",
      wide: true,
    },
    {
      label: "Full Name (English)",
      value: "Leonel Messi",
    },
    {
      label: "Full Name (Khmer)",
      value: "លីអូណែល មេស៊ី",
    },
    {
      label: "Gender",
      value: "Male",
    },
    {
      label: "Birth Of Date",
      value: "10-10-1982",
    },
    {
      label: "Nationality",
      value: "Khmer",
    },
    {
      label: "Ethnicity",
      value: "None",
    },
    {
      label: "Telephone",
      value: "+855 96 101 101",
    },
    {
      label: "Address",
      value: "Phnom Penh",
    },
  ],
};
