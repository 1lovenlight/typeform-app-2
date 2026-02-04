"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";

type FormStatus = "idle" | "loading" | "success" | "error";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setStatus("loading");
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus("success");
      // Brief delay to show success state before redirecting
      setTimeout(() => router.push("/home"), 500);
    } catch (error: unknown) {
      setStatus("error");
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleUpdatePassword}>
      <FieldGroup>
        <FieldSet>
          <div className="flex flex-col gap-1">
            <div className="text-lg font-medium">Reset Your Password</div>
            <FieldDescription>
              Please enter your new password below.
            </FieldDescription>
          </div>

          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="New password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading" || status === "success"}
              variant={status === "error" ? "destructive" : "default"}
            >
              {status === "loading" && <Spinner />}
              {status === "success" && <Check className="size-4" />}
              {status === "error" && "Try Again"}
              {status === "idle" && "Save new password"}
            </Button>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}
