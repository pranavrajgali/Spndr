"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-[#6B7280]">Start tracking in under a minute</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D9488]/40"
          />
        </label>
        <label className="block space-y-1 text-sm">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D9488]/40"
          />
        </label>
        {error && <p className="text-sm text-[#F43F5E]">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#0D9488]"
        >
          {loading ? "Creating…" : "Sign up"}
        </Button>
      </form>
      <p className="text-center text-sm text-[#6B7280]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#0D9488]">
          Log in
        </Link>
      </p>
    </main>
  );
}
