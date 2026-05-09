"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  isLoading?: boolean;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
}: DeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md overflow-hidden"
        showCloseButton={!isLoading}
      >
        <DialogHeader className="min-w-0">
          <DialogTitle className="min-w-0 max-w-[calc(100%-2.5rem)] truncate">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={isLoading} type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:text-white dark:hover:bg-destructive/90"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
