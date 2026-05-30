"use client";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
export function Modal({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Dialog
      defaultOpen
      open
      onOpenChange={() => router.back()}
    >
      <DialogContent className="sm:max-w-4xl px-10 py-8">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Create Class Modal</DialogTitle>
          </VisuallyHidden>

          <VisuallyHidden>
            <DialogDescription>
              Modal for creating a class.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}