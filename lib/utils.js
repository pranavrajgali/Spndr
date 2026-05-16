import { clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export function formatDate(date) {
  if (!date) return "";
  return format(new Date(date), "dd MMM yyyy");
}

export function getDaysUntilNextTransfer(frequency, targetDay) {
  const now = new Date();
  const today = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (frequency === "monthly") {
    let targetDate = new Date(currentYear, currentMonth, targetDay);
    if (now > targetDate) {
      targetDate = new Date(currentYear, currentMonth + 1, targetDay);
    }
    const diff = targetDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
  }

  if (frequency === "weekly") {
    // targetDay is 0 (Sun) to 6 (Sat)
    const currentDay = now.getDay();
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0) daysUntil = 7; // If today is transfer day, next is in 7 days
    return daysUntil;
  }

  return 30; // Default for flexible
}
