"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface CreateSessionParams {
  userId: string;
}

interface UsePracticeCallReturn {
  practiceCallId: string | null;
  createSession: (params: CreateSessionParams) => Promise<string | null>;
  clearSession: () => void;
  isCreating: boolean;
}

export function usePracticeCall(): UsePracticeCallReturn {
  const [practiceCallId, setPracticeCallId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const sessionCreatedRef = useRef(false);

  const createSession = useCallback(
    async (params: CreateSessionParams): Promise<string | null> => {
      // Prevent duplicate session creation
      if (sessionCreatedRef.current || isCreating) {
        console.log("[usePracticeCall] Session already created or creating");
        return practiceCallId;
      }

      setIsCreating(true);
      sessionCreatedRef.current = true;

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("practice_calls")
          .insert({
            user_id: params.userId,
            scoring_status: "waiting",
            // Minimal data on creation - webhook will enrich later with transcript, call_data, etc.
          })
          .select("id")
          .single();

        if (error) {
          console.error("[usePracticeCall] Error creating practice call:", error);
          sessionCreatedRef.current = false;
          return null;
        }

        console.log("[usePracticeCall] Practice call created:", data.id);
        setPracticeCallId(data.id);
        return data.id;
      } catch (error) {
        console.error("[usePracticeCall] Exception creating practice call:", error);
        sessionCreatedRef.current = false;
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, practiceCallId]
  );

  const clearSession = useCallback(() => {
    setPracticeCallId(null);
    sessionCreatedRef.current = false;
  }, []);

  return {
    practiceCallId,
    createSession,
    clearSession,
    isCreating,
  };
}


