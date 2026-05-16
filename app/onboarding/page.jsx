import OnboardingFlow from "@/components/OnboardingFlow";
import { createClient, getUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-16">
      <OnboardingFlow />
    </main>
  );
}
