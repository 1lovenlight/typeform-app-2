"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { updateUsername } from "@/lib/supabase/actions";
import { useUserProfile } from "@/lib/contexts/user-profile-context";

export function UpdateUsernameForm() {
  const profile = useUserProfile();
  const [username, setUsername] = useState(profile?.username || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required");
      toast.error("Username is required");
      return;
    }

    startTransition(async () => {
      try {
        await updateUsername(username);
        toast.success("Username updated!");
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update username";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          disabled={isPending}
          aria-invalid={!!error}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <div>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Spinner />}
          {isPending ? "" : "Update Username"}
        </Button>
      </div>
    </div>
  );
}
