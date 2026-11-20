import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  if (!isSupabaseConfigured()) redirect("/dashboard");
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
