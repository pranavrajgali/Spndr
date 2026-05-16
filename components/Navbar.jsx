import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-[#0D9488]/15 bg-white/60 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-[#134E4A]">
          SpendSense
        </Link>
        <nav className="hidden gap-4 text-sm font-medium md:flex">
          <Link href="/dashboard">Home</Link>
          <Link href="/dashboard/history">History</Link>
          <Link href="/dashboard/budgets">Budgets</Link>
          <Link href="/dashboard/chat">Chat</Link>
        </nav>
      </div>
    </header>
  );
}
