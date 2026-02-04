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

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setStatus("loading");
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
    <form onSubmit={handleLogin}>
      <FieldGroup>
        <FieldSet>
          <div className="flex flex-col gap-1">
            <div className="text-lg font-medium">Login</div>
            <FieldDescription>
              Enter your email below to login to your account
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
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="ml-auto text-muted-foreground hover:text-foreground inline-block text-sm"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {status === "idle" && "Login"}
            </Button>

            <div className="flex flex-row items-center justify-start gap-1">
              <div className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
              </div>
              <Link
                href="/sign-up"
                className="text-muted-foreground hover:text-foreground inline-block text-sm"
              >
                Sign up
              </Link>
            </div>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}
