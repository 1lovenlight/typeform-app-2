"use client";

import { Widget } from "@typeform/embed-react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getNextActivity, NextActivity } from "@/lib/utils/get-next-activity";
import { ActivityCompletionDialog } from "./activity-completion-dialog";

type DialogState = "closed" | "loading" | "success" | "timeout";

interface TypeformReactWidgetProps {
  formId: string;
  userId?: string | null;
  activityId?: string;
  hiddenFields?: Record<string, string>;
  className?: string;
}

export function TypeformReactWidget({
  formId,
  userId,
  activityId,
  hiddenFields = {},
  className,
}: TypeformReactWidgetProps) {
  const [dialogState, setDialogState] = useState<DialogState>("closed");
  const [nextActivity, setNextActivity] = useState<NextActivity | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prepare hidden fields (memoized to prevent unnecessary re-renders)
  const allHiddenFields = useMemo(() => {
    const fields = { ...hiddenFields };
    if (userId) {
      fields.user_id = userId;
    }
    return fields;
  }, [hiddenFields, userId]);

  // Memoize style object to prevent remounts
  const widgetStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current as unknown as number);
      }
    };
  }, []);

  // Handle form submission (memoized with useCallback to prevent remounts)
  const handleSubmit = useCallback(
    async (event: { responseId: string }) => {
      console.log("Form submitted with response ID:", event.responseId);

      // Only proceed if we have userId and activityId
      if (!userId || !activityId) {
        console.warn("Missing userId or activityId, skipping completion flow");
        return;
      }

      // Open dialog in loading state
      setDialogState("loading");

      const supabase = createClient();

      // Get initial completed_at timestamp to detect changes
      const { data: initialData } = await supabase
        .from("user_activity_completions")
        .select("completed_at")
        .eq("user_id", userId)
        .eq("activity_id", activityId)
        .single();

      const initialTimestamp = initialData?.completed_at;

      let pollCount = 0;
      const maxPolls = 20; // Poll for 10 seconds (every 500ms)

      const pollInterval = setInterval(async () => {
        pollCount++;

        const { data: currentData } = await supabase
          .from("user_activity_completions")
          .select("completed_at")
          .eq("user_id", userId)
          .eq("activity_id", activityId)
          .single();

        const currentTimestamp = currentData?.completed_at;

        // Check if timestamp changed (indicating new completion)
        if (currentTimestamp && currentTimestamp !== initialTimestamp) {
          clearInterval(pollInterval);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          // Fetch next activity
          const next = await getNextActivity(activityId, userId);
          setNextActivity(next);
          setDialogState("success");
          return;
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setDialogState("timeout");
        }
      }, 500);

      // Store interval ref for cleanup
      timeoutRef.current = pollInterval as unknown as NodeJS.Timeout;
    },
    [userId, activityId]
  ); // Dependencies for useCallback

  // Handle dialog close (memoized with useCallback)
  const handleDialogClose = useCallback(() => {
    setDialogState("closed");
    setNextActivity(null);

    // Cleanup
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current as unknown as number);
      timeoutRef.current = null;
    }
  }, []);

  // Validate formId
  if (!formId || typeof formId !== "string") {
    return (
      <div className="w-full aspect-2/1 flex items-center justify-center text-muted-foreground bg-accent rounded-lg">
        <p>Form ID is missing or invalid</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`w-full aspect-2/1 rounded-lg overflow-clip border ${
          className || ""
        }`}
      >
        <Widget
          id={formId}
          style={widgetStyle}
          hidden={allHiddenFields}
          lazy={true}
          onSubmit={handleSubmit}
        />
      </div>

      <ActivityCompletionDialog
        open={dialogState !== "closed"}
        state={dialogState === "closed" ? "loading" : dialogState}
        nextActivity={nextActivity}
        onClose={handleDialogClose}
      />
    </>
  );
}
