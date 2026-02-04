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
import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

type FormStatus = "idle" | "loading" | "success" | "error";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setStatus("loading");
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setStatus("success");
    } catch (error: unknown) {
      setStatus("error");
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleForgotPassword}>
      <FieldGroup>
        <FieldSet>
          <div className="flex flex-col gap-1">
            <div className="text-lg font-medium">Reset Your Password</div>
            <FieldDescription>
              We&apos;ll send you a link to reset your password
            </FieldDescription>
          </div>

          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                disabled={status === "success"}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            {status === "success" && (
              <FieldDescription className="text-foreground">
                ✓ Password reset instructions sent! If you registered using your
                email and password, you will receive a password reset email.
              </FieldDescription>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading" || status === "success"}
              variant={status === "error" ? "destructive" : "default"}
            >
              {status === "loading" && <Spinner />}
              {status === "success" && <Check className="size-4" />}
              {status === "error" && "Try Again"}
              {status === "idle" && "Send reset email"}
            </Button>

            <div className="flex flex-row items-center justify-start gap-1">
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
              </div>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground inline-block text-sm"
              >
                Login
              </Link>
            </div>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}
