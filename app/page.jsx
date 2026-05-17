import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0D9488]">
          Spndr
        </p>
        <h1 className="text-4xl font-bold leading-tight">
          Track money without linking your bank
        </h1>
        <p className="text-[#6B7280]">
          Manual entry, CSV imports, AI categorization, and chat — built for
          Indian college students.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex h-9 items-center justify-center rounded-full bg-[#0D9488] px-8 text-sm font-medium text-white hover:bg-[#0f766e]"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-full border border-[#0D9488]/30 px-8 text-sm font-medium hover:bg-white/80"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
