export type CategoryType = 
  | "Продукты"
  | "Транспорт"
  | "Кафе и Еда"
  | "Дети"
  | "Здоровье"
  | "Развлечения"
  | "Дом и ЖКХ"
  | "Покупки"
  | "Прочее";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: CategoryType;
  date: string; // ISO string or YYYY-MM-DD
  time: string; // HH:MM
  member: string; // e.g. "Алексей", "Мария"
  source?: "voice" | "text" | "receipt" | "manual";
  receiptItems?: { name: string; price: number }[];
}

export interface MandatoryPayment {
  id: string;
  name: string;
  amount: number;
  dueDate: number; // day of month e.g. 15
  isPaid: boolean;
  category: CategoryType;
}

export interface FamilyGoal {
  id: string;
  title: string;
  emoji: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  joinedAt: string;
}

export interface ServerConfig {
  mode: "local_only" | "self_hosted";
  serverUrl: string; // e.g. "http://185.22.33.44:3000" or empty
  familyCode: string; // e.g. "SAFE-77"
  syncIntervalSeconds: number; // 0 (manual), 10, 20, 60
}

export interface BudgetConfig {
  monthlyIncome: number;
  savingsGoalMonthly: number;
  daysToSalary: number;
  salaryDate: string; // e.g. "2026-08-05"
  activeMemberFilter: string; // "Вся семья" | "Алексей" | "Мария"
  syncIntervalSeconds?: number; // 0 = manual, 10, 20, 60
  familyCode?: string; // 6-digit family invite code
  serverUrl?: string; // custom server host or empty for current host
  syncMode?: "local_only" | "self_hosted";
}

export interface ParsedExpense {
  amount: number;
  category: CategoryType;
  name: string;
  member: string;
  parsedBy?: string;
}
