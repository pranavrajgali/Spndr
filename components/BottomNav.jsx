"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  History,
  Plus,
  Wallet,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/transactions", label: "Add", icon: Plus, fab: true },
  { href: "/dashboard/budgets", label: "Budgets", icon: Wallet },
  { href: "/dashboard/chat", label: "Chat", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#0D9488]/15 bg-white/80 px-2 pb-safe backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-lg items-end justify-between py-2">
        {tabs.map(({ href, label, icon: Icon, fab }) => {
          const active = pathname === href;
          if (fab) {
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="-mt-6 flex size-14 items-center justify-center rounded-full bg-[#0D9488] text-white shadow-lg"
                  aria-label={label}
                >
                  <Icon className="size-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 text-xs",
                  active ? "text-[#0D9488]" : "text-[#6B7280]"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
