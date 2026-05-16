import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { createClient, getUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
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

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-8">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
