import Link from "next/link";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/server";

export async function AuthButtons() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <div className="flex flex-row gap-2 w-full">
      {user ? (
        <Link href="/home">
          <Button>Home</Button>
        </Link>
      ) : (
        <>
          <Link href="/sign-up">
            <Button className="w-full">Sign up</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Login
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
