export type HistoryClassCard = {
  id: number;
  title: string;
  status: "History";
  variant: "history";
  classNameValue: string;
  shift: string;
  time: string;
  lab: string;
  students: string;
  code: string;
  group: string;
};

export const historyClassCards: HistoryClassCard[] = [
  {
    id: 1,
    title: "Bachelor",
    status: "History",
    variant: "history",
    classNameValue: "Full-Stack Development",
    shift: "Morning",
    time: "8:00 - 12:00 AM",
    lab: "Lab 1",
    students: "24/8",
    code: "B001",
    group: "Bachelor",
  },
  {
    id: 2,
    title: "Bachelor",
    status: "History",
    variant: "history",
    classNameValue: "Software Engineering",
    shift: "Afternoon",
    time: "1:00 - 5:00 PM",
    lab: "Lab 2",
    students: "28/10",
    code: "B002",
    group: "Bachelor",
  },
  {
    id: 3,
    title: "Associate",
    status: "History",
    variant: "history",
    classNameValue: "IT Professional",
    shift: "Evening",
    time: "5:30 - 8:30 PM",
    lab: "Lab 3",
    students: "20/6",
    code: "A001",
    group: "Associate",
  },
  {
    id: 4,
    title: "Scholarship",
    status: "History",
    variant: "history",
    classNameValue: "Foundation",
    shift: "Morning",
    time: "8:00 - 11:00 AM",
    lab: "Lab 4",
    students: "32/14",
    code: "S001",
    group: "Scholarship",
  },
];

export const groupedHistoryClassCards = historyClassCards.reduce<
  Record<string, HistoryClassCard[]>
>((groups, historyClass) => {
  (groups[historyClass.group] ??= []).push(historyClass);
  return groups;
}, {});
