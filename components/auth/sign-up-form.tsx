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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";

type FormStatus = "idle" | "loading" | "success" | "error";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setStatus("loading");
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setStatus("error");
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        },
      });
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
    <form onSubmit={handleSignUp}>
      <FieldGroup>
        <FieldSet>
          <div className="flex flex-col gap-1">
            <div className="text-lg font-medium">Sign up</div>
            <FieldDescription>Create a new account</FieldDescription>
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
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="repeat-password">Repeat Password</FieldLabel>
              <Input
                id="repeat-password"
                type="password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
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
              {status === "idle" && "Sign up"}
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
