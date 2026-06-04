"use client";

import { Input } from "@/components/ui/input";
import { ListFilter, UserRoundSearch } from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  TableMeta,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  showStudentActions?: boolean;
  showAddStudentButton?: boolean;
  studentSummaryText?: string;
  showNote?: boolean;
  studentProfileBasePath?: string;
}

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    expandedRowId?: string | null;
    studentProfileBasePath?: string;
    toggleExpandedRow?: (rowId: string) => void;
  }
}

export function DataTableList<TData, TValue>({
  columns,
  data,
  showStudentActions = false,
  showAddStudentButton = true,
  studentSummaryText,
  showNote = true,
  studentProfileBasePath,
}: DataTableProps<TData, TValue>) {
  const params = useParams<{
    id?: string | string[];
    classcode?: string | string[];
  }>();
  const pathname = usePathname();
  const classroomId = Array.isArray(params.id) ? params.id[0] : params.id;
  const classcode = Array.isArray(params.classcode)
    ? params.classcode[0]
    : params.classcode;
  const resolvedStudentProfileBasePath =
    studentProfileBasePath ??
    (classroomId
      ? `/dashboard/classrooms/${classroomId}/student-profile`
      : undefined);
  const showReportActions = classcode
    ? pathname.startsWith(`/class/${classcode}/report`)
    : pathname.includes("/report");

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);
  const tableColumns = React.useMemo<ColumnDef<TData, unknown>[]>(
    () => [
      ...(columns as ColumnDef<TData, unknown>[]),
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        cell: () => (
          <span className="font-medium text-gray-500">pending</span>
        ),
      },
    ],
    [columns],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),

    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      expandedRowId,
      studentProfileBasePath: resolvedStudentProfileBasePath,
      toggleExpandedRow: (rowId: string) => {
        setExpandedRowId((current) => (current === rowId ? null : rowId));
      },
    } satisfies TableMeta<TData>,
  });

  return (
    <div>
      <div className="flex items-center justify-between pb-4">
        <Input
          placeholder="Search name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm py-5"
        />
        {showReportActions && (
          <div className="flex items-center gap-4">
            <Link
              href={classcode ? `/class/${classcode}/class_list` : "/class"}
              aria-label="Student list options"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-50"
            >
              <UserRoundSearch className="h-5 w-5" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Filter"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-50"
                >
                  <ListFilter className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 p-1">
                <DropdownMenuItem asChild className="justify-center text-sm text-gray-500 hover:text-black focus:text-black">
                  <Link
                    href={classcode ? `/class/${classcode}/report` : "/class"}
                  >
                    Day Report
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="justify-center text-sm text-gray-500 hover:text-black focus:text-black">
                  <Link
                    href={
                      classcode
                        ? `/class/${classcode}/report/weekly_report`
                        : "/class"
                    }
                  >
                    Weekly Report
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="justify-center text-sm text-gray-500 hover:text-black focus:text-black">
                  <Link
                    href={
                      classcode
                        ? `/class/${classcode}/report/monthly_report`
                        : "/class"
                    }
                  >
                    Monthly Report
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="justify-center text-sm text-gray-500 hover:text-black focus:text-black">
                  <Link
                    href={
                      classcode
                        ? `/class/${classcode}/report/warning_report`
                        : "/class"
                    }
                  >
                    Student Warning
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {
          !showReportActions && (
            <div className="flex justify-start text-sm items-center gap-4 text-gray-600 border px-4 py-2 rounded-lg">
              <div>
                <p>Date: <span className="text-primary">11-Nov-2026</span></p>
                <p className="text-right">Student(Total/ False): <span className="text-primary"> 11/03</span></p>
              </div>
              <div>
                <p className="text-primary">|</p>
                <p className="text-primary">|</p>
              </div>
              <div>
                <p >Time: <span className="text-primary"> 8:00 - 12:00PM</span></p>
                <p >Class Code: <span className="text-primary">A001</span> </p>
              </div>
            </div>
          )
        }
        
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="text-gray-500">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const rowData = row.original as TData & {
                  id?: string;
                  permissionReason?: string;
                  lateReason?: string;
                };
                const hasExpandedDetails =
                  !!rowData.permissionReason || !!rowData.lateReason;
                const isExpanded =
                  !!rowData.id &&
                  hasExpandedDetails &&
                  expandedRowId === String(rowData.id);
                return (
                  <React.Fragment key={row.id}>
                    <TableRow data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell
                          colSpan={tableColumns.length}
                          className="bg-white px-8 py-4"
                        >
                          <div className="space-y-2 text-right text-sm">
                            {rowData.permissionReason && (
                              <p>
                                <span className="text-red-500">Permission:</span>{" "}
                                <span className="text-[#1f1f1f]">
                                  {rowData.permissionReason}
                                </span>
                              </p>
                            )}
                            {rowData.lateReason && (
                              <p>
                                <span className="text-amber-500">Late:</span>{" "}
                                <span className="text-[#1f1f1f]">
                                  {rowData.lateReason}
                                </span>
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
      </div>
    </div>
  );
}
