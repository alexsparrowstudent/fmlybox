import { Transaction, MandatoryPayment, FamilyGoal, BudgetConfig, FamilyMember } from "../types";

export const initialFamilyMembers: FamilyMember[] = [
  { id: "mem_1", name: "Алексей", avatar: "👨‍💻", role: "admin", joinedAt: "2026-01-15" },
  { id: "mem_2", name: "Мария", avatar: "👩‍🎨", role: "member", joinedAt: "2026-01-16" },
];

export const initialBudgetConfig: BudgetConfig = {
  monthlyIncome: 135000,
  savingsGoalMonthly: 15000,
  daysToSalary: 12,
  salaryDate: "2026-08-06",
  activeMemberFilter: "Вся семья",
  syncIntervalSeconds: 20,
  familyCode: "SAFE-77",
};

export const initialMandatoryPayments: MandatoryPayment[] = [
  { id: "m1", name: "Ипотека / Аренда", amount: 35000, dueDate: 10, isPaid: true, category: "Дом и ЖКХ" },
  { id: "m2", name: "ЖКХ и Электричество", amount: 7200, dueDate: 15, isPaid: true, category: "Дом и ЖКХ" },
  { id: "m3", name: "Детский сад и Секции", amount: 8500, dueDate: 5, isPaid: true, category: "Дети" },
  { id: "m4", name: "Мобильная связь и Интернет", amount: 1800, dueDate: 20, isPaid: false, category: "Дом и ЖКХ" },
  { id: "m5", name: "Кредит на авто", amount: 12000, dueDate: 25, isPaid: false, category: "Транспорт" },
];

export const initialFamilyGoals: FamilyGoal[] = [
  { id: "g1", title: "Поездка на море", emoji: "🏖️", currentAmount: 145000, targetAmount: 200000, monthlyContribution: 10000 },
  { id: "g2", title: "Новый ноутбук для учебы", emoji: "💻", currentAmount: 38000, targetAmount: 75000, monthlyContribution: 5000 },
];

const today = new Date().toISOString().split("T")[0];
const yesterdayDate = new Date(Date.now() - 86400000);
const yesterday = yesterdayDate.toISOString().split("T")[0];

export const initialTransactions: Transaction[] = [
  {
    id: "t1",
    name: "Супермаркет 'Перекресток'",
    amount: 1420,
    category: "Продукты",
    date: today,
    time: "12:35",
    member: "Алексей",
    source: "text",
  },
  {
    id: "t2",
    name: "Аптека '36.6'",
    amount: 680,
    category: "Здоровье",
    date: today,
    time: "09:15",
    member: "Мария",
    source: "voice",
  },
  {
    id: "t3",
    name: "Заправка Shell (Бензин АИ-95)",
    amount: 2500,
    category: "Транспорт",
    date: yesterday,
    time: "18:40",
    member: "Алексей",
    source: "receipt",
    receiptItems: [
      { name: "Топливо АИ-95 (45л)", price: 2350 },
      { name: "Кофе Капучино XL", price: 150 },
    ],
  },
  {
    id: "t4",
    name: "Кафе 'Кофемания' (Обед)",
    amount: 950,
    category: "Кафе и Еда",
    date: yesterday,
    time: "13:20",
    member: "Мария",
    source: "text",
  },
  {
    id: "t5",
    name: "Детский магазин 'Детский Мир'",
    amount: 2100,
    category: "Дети",
    date: yesterday,
    time: "11:00",
    member: "Мария",
    source: "manual",
  },
];
