"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface PostCallDialogProps {
  open: boolean;
  userId: string | null;
  onClose: () => void;
}

export function PostCallDialog({
  open,
  userId,
  onClose,
}: PostCallDialogProps) {
  const [practiceCallId, setPracticeCallId] = useState<string | null>(null);
  const [scoringStatus, setScoringStatus] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState<string | null>(null);
  const router = useRouter();

  // Fetch the latest practice call when dialog opens
  useEffect(() => {
    if (!open || !userId) return;

    const fetchLatestCall = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("practice_calls")
        .select("id, scoring_status, status_reason")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setPracticeCallId(data.id);
        setScoringStatus(data.scoring_status);
        setStatusReason(data.status_reason);
      }
    };

    fetchLatestCall();
  }, [open, userId]);

  // Poll practice_calls.scoring_status every 2 seconds
  useEffect(() => {
    if (!practiceCallId || !open) return;

    const supabase = createClient();

    const pollStatus = async () => {
      const { data } = await supabase
        .from("practice_calls")
        .select("scoring_status, status_reason")
        .eq("id", practiceCallId)
        .single();

      if (data) {
        setScoringStatus(data.scoring_status);
        setStatusReason(data.status_reason);

        // Stop polling if terminal state
        if (["complete", "failed", "skipped"].includes(data.scoring_status)) {
          clearInterval(intervalId);
        }
      }
    };

    pollStatus(); // Initial fetch
    const intervalId = setInterval(pollStatus, 2000); // Poll every 2s

    return () => clearInterval(intervalId);
  }, [practiceCallId]);

  const handleViewFeedback = () => {
    if (scoringStatus === "complete" && practiceCallId) {
      router.push(`/practice/scorecard/${practiceCallId}`);
    }
  };

  const handlePracticeAgain = () => {
    window.location.reload();
  };

  const handleBackToHome = () => {
    onClose();
    router.push("/home");
  };

  // Determine button states based on scoring status
  const isComplete = scoringStatus === "complete";
  const isFailed = scoringStatus === "failed";
  const isSkipped = scoringStatus === "skipped";
  const isProcessing =
    scoringStatus === "waiting" || scoringStatus === "processing";

  // Determine title and description
  const getTitle = () => {
    if (isComplete) return "Processing complete";
    if (isFailed) return "Something went wrong";
    if (isSkipped) return "Call skipped (too short)";
    return "Processing your call...";
  };

  const getDescription = () => {
    if (isComplete)
      return "Your scorecard is ready! Click below to view.";
    if (isFailed)
      return statusReason || "We couldn't analyze your call. TODO: Please try again.";
    if (isSkipped)
      return "Your call was too short to analyze.";
    return "We're analyzing your conversation now. This usually takes 10-20 seconds.";
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription className="flex items-start gap-2">
            {isProcessing && <Spinner />}
            <span>{getDescription()}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleBackToHome}
            className="w-full sm:w-auto"
          >
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={handlePracticeAgain}
            className="w-full sm:w-auto"
          >
            Practice Again
          </Button>
          <AlertDialogAction
            onClick={handleViewFeedback}
            disabled={!isComplete}
            className={
              isComplete
                ? "bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                : "w-full sm:w-auto"
            }
          >
            {isProcessing && "Analyzing..."}
            {isComplete && "View Feedback"}
            {isFailed && "Error"}
            {isSkipped && "Call Too Short"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
