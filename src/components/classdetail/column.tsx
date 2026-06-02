"use client";

import { AttendanceList } from "@/types/attendance";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const columns: ColumnDef<AttendanceList>[] = [
  {
    accessorKey: "order",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No.
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("order")}</div>
    ),
  },
  {
    accessorKey: "id",
    header: "Student ID",
  },
  {
    accessorKey: "profile",
    header: "Profile",
    cell: ({ row, table }) => {
      const profileUrl = row.original.profile;
      const profileBasePath = table.options.meta?.studentProfileBasePath;
      const profileHref =
        profileBasePath && row.original.id
          ? `${profileBasePath}/${row.original.id}`
          : "/dashboard/profile";

      if (!profileUrl) {
        return <span>No image</span>;
      }

      return (
        <Link href={profileHref}>
          <Image
            width={50}
            height={50}
            src={profileUrl}
            alt={`${row.original.name} profile`}
            className="h-10 w-10 rounded-xl object-cover"
          />
        </Link>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of birth",
  },
];

export const statusColumns: ColumnDef<AttendanceList>[] = [
  ...columns.slice(0, -1),
  {
    accessorKey: "status",
    header: "Status",
  },
];
