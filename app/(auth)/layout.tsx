import { AuthContainer } from "@/components/layout/page-container";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (!error && data?.user) {
    redirect("/home");
  }

  return <AuthContainer>{children}</AuthContainer>;
}
