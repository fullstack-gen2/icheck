// components/ui/class-card.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClassCardProps {
  title: string;
  status?: string;
  classNameValue: string;
  shift: string;
  time: string;
  students: string;
  code: string;
}

export function ClassCard({
  title,
  status = "Active",
  classNameValue,
  shift,
  time,
  students,
  code,
}: ClassCardProps) {
  return (
    <Card className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-gray-300 bg-white  p-0">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#273C97] px-4 py-3 text-white">
        <h2 className="text-3xl font-bold leading-none">{title}</h2>

        <Badge className="bg-transparent p-0 text-sm font-medium text-white hover:bg-transparent">
          {status}
        </Badge>
      </div>

      {/* Body */}
      <CardContent className="space-y-2 px-4 py-3 text-[18px]">
        <div className="flex">
          <span className="w-31.25 font-medium text-black">Class:</span>
          <span className="text-black">{classNameValue}</span>
        </div>

        <div className="flex">
          <span className="w-31.25 font-medium text-black">Shift:</span>
          <span className="text-black">{shift}</span>
        </div>

        <div className="flex">
          <span className="w-31.25 font-medium text-black">Time:</span>
          <span className="text-black">{time}</span>
        </div>

        <div className="flex">
          <span className="w-31.25 font-medium text-black">Student (T/F):</span>
          <span className="text-black">{students}</span>
        </div>

        {/* Footer Code */}
        <div className="mt-3 border-t border-gray-300 pt-3"></div>
        <div className="flex justify-end pt-2">
          <span className="text-sm text-black">code: {code}</span>
        </div>
      </CardContent>
    </Card>
  );
}
