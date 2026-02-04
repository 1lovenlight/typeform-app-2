"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
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
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { NextActivity } from "@/lib/utils/get-next-activity";

type DialogState = "loading" | "success" | "timeout";

interface ActivityCompletionDialogProps {
  open: boolean;
  state: DialogState;
  nextActivity: NextActivity | null;
  onClose: () => void;
}

export function ActivityCompletionDialog({
  open,
  state,
  nextActivity,
  onClose,
}: ActivityCompletionDialogProps) {
  if (state === "loading") {
    return (
      <AlertDialog open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Checking your completion...</AlertDialogTitle>
            <AlertDialogDescription>
              Please wait while we verify your submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-8" />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (state === "success" && nextActivity) {
    return (
      <AlertDialog open={open} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Activity Completed!</AlertDialogTitle>
            <AlertDialogDescription>
              Great job! Here&apos;s what&apos;s next in your learning journey.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Item
              variant="outline"
              asChild
              className="p-0 overflow-hidden gap-0 rounded-md"
            >
              <Link
                href={`/activity/${nextActivity.activity_id}`}
                className="group transition-all duration-500"
                onClick={onClose}
              >
                <ItemHeader className="bg-accent aspect-video relative">
                  <ArrowUpRightIcon
                    strokeWidth={1}
                    className="absolute size-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-500 z-50"
                  />
                </ItemHeader>
                <ItemContent className="gap-2 p-4 sm:p-6">
                  <ItemTitle className="text-xl font-medium">
                    {nextActivity.activity_title}
                  </ItemTitle>
                  {nextActivity.activity_description && (
                    <ItemDescription className="text-base">
                      {nextActivity.activity_description}
                    </ItemDescription>
                  )}
                </ItemContent>
              </Link>
            </Item>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Link href="/browse">Back to Browse</Link>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href={`/activity/${nextActivity.activity_id}`}>
                Continue to Next
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Timeout or no next activity
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activity Submitted</AlertDialogTitle>
          <AlertDialogDescription>
            {state === "timeout"
              ? "Your submission is being processed. It may take a moment to appear in your progress."
              : "You've completed all available activities!"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Link href="/browse">Back to Browse</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
