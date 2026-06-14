"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "lucide-react";
import {
  ScheduleFormDialog,
  type ScheduleFormValue,
} from "@/components/schedule-form-dialog";
import { ItePresetInner } from "@/components/ite-preset-dialog";
import { api } from "@/lib/api-client";

interface ClassroomOpt { id: number; className: string; }

/** "Add Schedule" header button — opens an empty form. */
export function ScheduleAddButton({ classrooms }: { classrooms?: ClassroomOpt[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <PlusIcon className="size-4" /> Add Schedule
      </Button>
      <ScheduleFormDialog
        open={open}
        onOpenChange={setOpen}
        classrooms={classrooms}
      />
    </>
  );
}

/** ITE 2-slot preset — creates both daily slots (13:30–17:30, 18:00–20:30)
 *  in a single call so the admin doesn't hand-enter two rows. */
export function ItePresetButton({ classrooms }: { classrooms?: ClassroomOpt[] }) {
  return <ItePresetInner classrooms={classrooms} />;
}

/** Per-row dropdown — edit + delete. */
export function ScheduleRowActions({
  schedule,
  classrooms,
}: {
  schedule: ScheduleFormValue;
  classrooms?: ClassroomOpt[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen]   = useState(false);

  async function confirmDelete() {
    try {
      await api.del(`/schedules/${schedule.id}`);
      toast.success("Schedule deleted.");
      setDelOpen(false);
      router.refresh();
    } catch (e) {
      // Backend returns 409 with a clear "set inactive instead" hint when the
      // schedule has historical attendance — pass that through rather than a
      // generic "Delete failed." which would leave the admin guessing.
      toast.error(getErrorMessage(e, "Delete failed."));
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon className="size-4 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
            onClick={() => setDelOpen(true)}
          >
            <TrashIcon className="size-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScheduleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={schedule}
        classrooms={classrooms}
      />

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              {schedule.className} · {schedule.startTime?.slice(0, 5)}–{schedule.endTime?.slice(0, 5)}
              <br />
              This permanently removes the slot from the timetable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
