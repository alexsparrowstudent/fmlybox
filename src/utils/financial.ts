import { CategoryType, MandatoryPayment, Transaction } from "../types";

export const CATEGORIES: CategoryType[] = [
  "Продукты",
  "Транспорт",
  "Кафе и Еда",
  "Дети",
  "Здоровье",
  "Развлечения",
  "Дом и ЖКХ",
  "Покупки",
  "Прочее",
];

export function formatRubles(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount).replace("RUB", "₽").trim();
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("ru-RU").format(amount);
}

/**
 * Safe-to-Spend Calculation Formula:
 * Safe-to-Spend per day = (Monthly Income - Mandatory Payments - Monthly Savings Goal - Total Spent This Month) / Days Left to Salary
 */
export function calculateSafeToSpend(
  monthlyIncome: number,
  mandatoryPayments: MandatoryPayment[],
  savingsGoalMonthly: number,
  transactions: Transaction[],
  daysToSalary: number
): {
  safeDailyLimit: number;
  mandatoryTotal: number;
  mandatoryPaidTotal: number;
  totalSpentThisMonth: number;
  todaySpent: number;
  safeZoneStatus: "safe" | "warning" | "exceeded";
} {
  const mandatoryTotal = mandatoryPayments.reduce((sum, p) => sum + p.amount, 0);
  const mandatoryPaidTotal = mandatoryPayments.filter((p) => p.isPaid).reduce((sum, p) => sum + p.amount, 0);

  const totalSpentThisMonth = transactions.reduce((sum, t) => sum + t.amount, 0);

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySpent = transactions
    .filter((t) => t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const safePoolRemaining = monthlyIncome - mandatoryTotal - savingsGoalMonthly - (totalSpentThisMonth - todaySpent);
  const days = Math.max(daysToSalary, 1);
  const safeDailyLimit = Math.max(Math.round(safePoolRemaining / days), 0);

  let safeZoneStatus: "safe" | "warning" | "exceeded" = "safe";
  const remainingToday = safeDailyLimit - todaySpent;
  if (remainingToday < 0) {
    safeZoneStatus = "exceeded";
  } else if (remainingToday < safeDailyLimit * 0.25) {
    safeZoneStatus = "warning";
  }

  return {
    safeDailyLimit,
    mandatoryTotal,
    mandatoryPaidTotal,
    totalSpentThisMonth,
    todaySpent,
    safeZoneStatus,
  };
}

export function getCategoryInfo(category: CategoryType): {
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (category) {
    case "Продукты":
      return { icon: "🛒", color: "text-emerald-400", bgColor: "bg-emerald-950/40", borderColor: "border-emerald-500/30" };
    case "Транспорт":
      return { icon: "🚗", color: "text-sky-400", bgColor: "bg-sky-950/40", borderColor: "border-sky-500/30" };
    case "Кафе и Еда":
      return { icon: "☕", color: "text-amber-400", bgColor: "bg-amber-950/40", borderColor: "border-amber-500/30" };
    case "Дети":
      return { icon: "🧸", color: "text-pink-400", bgColor: "bg-pink-950/40", borderColor: "border-pink-500/30" };
    case "Здоровье":
      return { icon: "💊", color: "text-rose-400", bgColor: "bg-rose-950/40", borderColor: "border-rose-500/30" };
    case "Развлечения":
      return { icon: "🎬", color: "text-purple-400", bgColor: "bg-purple-950/40", borderColor: "border-purple-500/30" };
    case "Дом и ЖКХ":
      return { icon: "🏠", color: "text-indigo-400", bgColor: "bg-indigo-950/40", borderColor: "border-indigo-500/30" };
    case "Покупки":
      return { icon: "🛍️", color: "text-cyan-400", bgColor: "bg-cyan-950/40", borderColor: "border-cyan-500/30" };
    case "Прочее":
    default:
      return { icon: "📦", color: "text-slate-400", bgColor: "bg-slate-800/40", borderColor: "border-slate-700/30" };
  }
}
