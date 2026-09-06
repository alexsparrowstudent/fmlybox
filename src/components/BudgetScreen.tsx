import React, { useState } from "react";
import { BudgetConfig, MandatoryPayment, CategoryType } from "../types";
import { formatRubles, formatNumber, getCategoryInfo } from "../utils/financial";
import { Plus, Trash2, CheckCircle2, Circle, Calculator, Sliders, Calendar, DollarSign, HelpCircle } from "lucide-react";

interface BudgetScreenProps {
  config: BudgetConfig;
  mandatoryPayments: MandatoryPayment[];
  onUpdateConfig: (updated: Partial<BudgetConfig>) => void;
  onToggleMandatoryPaid: (id: string) => void;
  onAddMandatory: (payment: Omit<MandatoryPayment, "id" | "isPaid">) => void;
  onDeleteMandatory: (id: string) => void;
  safeDailyLimit: number;
}

const CATEGORIES: CategoryType[] = [
  "Дом и ЖКХ",
  "Транспорт",
  "Дети",
  "Здоровье",
  "Продукты",
  "Прочее",
];

export const BudgetScreen: React.FC<BudgetScreenProps> = ({
  config,
  mandatoryPayments,
  onUpdateConfig,
  onToggleMandatoryPaid,
  onAddMandatory,
  onDeleteMandatory,
  safeDailyLimit,
}) => {
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState<number>(5000);
  const [newDueDate, setNewDueDate] = useState<number>(15);
  const [newCategory, setNewCategory] = useState<CategoryType>("Дом и ЖКХ");

  const mandatoryTotal = mandatoryPayments.reduce((s, p) => s + p.amount, 0);

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newAmount <= 0) return;
    onAddMandatory({
      name: newName,
      amount: newAmount,
      dueDate: newDueDate,
      category: newCategory,
    });
    setNewName("");
    setNewAmount(5000);
    setIsAddPaymentOpen(false);
  };

  return (
    <div className="w-full p-4 space-y-5 animate-in fade-in">
      {/* Page Title Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <span>Бюджет и Правила Семьи</span>
          </h2>
          <p className="text-xs text-slate-400">
            Настройка базовых доходов и обязательных списаний
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Лимит в день</div>
          <div className="text-base font-extrabold text-emerald-400 font-mono">
            {formatRubles(safeDailyLimit)}
          </div>
        </div>
      </div>

      {/* Formula Explainer Card */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/30 backdrop-blur-md relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-2">
          <Calculator className="w-4 h-4" />
          <span>Формула Safe-to-Spend (Дневного лимита)</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 leading-relaxed">
          <div className="text-emerald-400 font-bold mb-1">
            Дневной Лимит = (Доход - Обязательные - Копилка - Потрачено) / Дней до ЗП
          </div>
          <div className="text-slate-400 text-[10px]">
            = ({formatNumber(config.monthlyIncome)} - {formatNumber(mandatoryTotal)} - {formatNumber(config.savingsGoalMonthly)} - Потрачено) / {config.daysToSalary} дн.
          </div>
        </div>
      </div>

      {/* Main Income & Savings Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
          1. Ежемесячные Поступления и Копилка
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Monthly Income */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">
              Совокупный доход семьи (в месяц):
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.monthlyIncome}
                onChange={(e) =>
                  onUpdateConfig({ monthlyIncome: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">₽</span>
            </div>
          </div>

          {/* Monthly Savings Target */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">
              Отчисление в Копилку / Цели:
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.savingsGoalMonthly}
                onChange={(e) =>
                  onUpdateConfig({ savingsGoalMonthly: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">₽</span>
            </div>
          </div>
        </div>

        {/* Days to Salary */}
        <div>
          <label className="text-[11px] text-slate-400 font-medium block mb-1">
            Дней осталось до следующего аванса / зарплаты:
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="31"
              value={config.daysToSalary}
              onChange={(e) =>
                onUpdateConfig({ daysToSalary: Number(e.target.value) || 1 })
              }
              className="flex-1 accent-sky-400 cursor-pointer"
            />
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs font-bold text-sky-400 min-w-[60px] text-center">
              {config.daysToSalary} дн.
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Payments Section */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              2. Обязательные Платежи ({formatRubles(mandatoryTotal)})
            </h3>
            <p className="text-[10px] text-slate-400">
              Ипотека, ЖКХ, садики — резервируются заранее
            </p>
          </div>

          <button
            onClick={() => setIsAddPaymentOpen(!isAddPaymentOpen)}
            className="px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>

        {/* Add Payment Form */}
        {isAddPaymentOpen && (
          <form
            onSubmit={handleCreatePayment}
            className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/40 space-y-3 animate-in fade-in"
          >
            <div className="text-xs font-bold text-sky-400">
              Новый обязательный платеж
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Название (например, Ипотека)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                required
              />
              <input
                type="number"
                placeholder="Сумма ₽"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                required
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 block">День месяца:</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 block">Категория:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CategoryType)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
            >
              Сохранить платеж
            </button>
          </form>
        )}

        {/* Mandatory Payments List */}
        <div className="space-y-2">
          {mandatoryPayments.map((p) => {
            const cat = getCategoryInfo(p.category);
            return (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onToggleMandatoryPaid(p.id)}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                    title={p.isPaid ? "Отмечено как оплаченное" : "Отметить оплаченным"}
                  >
                    {p.isPaid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        p.isPaid ? "line-through text-slate-500" : "text-slate-200"
                      }`}
                    >
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Списание: {p.dueDate}-го числа • {p.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">
                    {formatRubles(p.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteMandatory(p.id)}
                    className="text-slate-600 hover:text-rose-400 p-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
