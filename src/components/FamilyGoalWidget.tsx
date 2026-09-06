import React, { useState } from "react";
import { FamilyGoal } from "../types";
import { formatRubles, formatNumber } from "../utils/financial";
import { Plus, Target, Check } from "lucide-react";

interface FamilyGoalWidgetProps {
  goals: FamilyGoal[];
  onAddDeposit: (goalId: string, amount: number) => void;
}

export const FamilyGoalWidget: React.FC<FamilyGoalWidgetProps> = ({
  goals,
  onAddDeposit,
}) => {
  const [activeGoalIndex, setActiveGoalIndex] = useState(0);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>("");

  const currentGoal = goals[activeGoalIndex] || goals[0];
  if (!currentGoal) return null;

  const percent = Math.min(
    Math.round((currentGoal.currentAmount / currentGoal.targetAmount) * 100),
    100
  );

  const handleDeposit = (amount: number) => {
    if (amount <= 0) return;
    onAddDeposit(currentGoal.id, amount);
    setIsDepositOpen(false);
    setCustomAmount("");
  };

  return (
    <div className="w-full my-4 p-5 rounded-[28px] bg-slate-900/60 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-xl">
      {/* Header & Goal Selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
          <Target className="w-4 h-4 text-amber-400" />
          <span>Семейная Копилка & Цели</span>
        </div>

        {/* Multi-goal selector */}
        <div className="flex items-center gap-1.5">
          {goals.map((g, i) => (
            <button
              key={g.id || i}
              onClick={() => setActiveGoalIndex(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeGoalIndex === i
                  ? "bg-amber-400 w-5 shadow-[0_0_8px_#fbbf24]"
                  : "bg-slate-700 w-2 hover:bg-slate-600"
              }`}
              title={g.title}
            />
          ))}
        </div>
      </div>

      {/* Main Goal Card Info */}
      <div className="flex items-start justify-between my-2">
        <div className="flex items-center gap-3">
          <div className="text-3xl p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(251,191,36,0.15)]">
            {currentGoal.emoji}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">
              {currentGoal.title}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Накоплено:{" "}
              <strong className="text-amber-300 font-mono font-bold">
                {formatRubles(currentGoal.currentAmount)}
              </strong>{" "}
              из {formatNumber(currentGoal.targetAmount)} ₽
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDepositOpen(!isDepositOpen)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Пополнить</span>
        </button>
      </div>

      {/* Bento Liquid Progress Bar */}
      <div className="w-full h-3 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-white/10 my-3 relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 transition-all duration-700 relative shadow-[0_0_12px_rgba(251,191,36,0.4)]"
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
        <span>Прогресс: <strong className="text-amber-300 font-mono font-bold">{percent}%</strong></span>
        <span>
          {currentGoal.targetAmount <= currentGoal.currentAmount ? (
            <strong className="text-emerald-400 font-bold">🎉 Цель достигнута!</strong>
          ) : (
            <>
              Осталось: <strong className="text-slate-200 font-mono font-bold">{formatRubles(currentGoal.targetAmount - currentGoal.currentAmount)}</strong>
            </>
          )}
        </span>
      </div>

      {/* Deposit Quick Popover */}
      {isDepositOpen && (
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/40 text-xs backdrop-blur-md animate-in fade-in shadow-2xl space-y-2.5">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Внести в цель {currentGoal.title}:
          </div>

          <div className="flex items-center gap-2">
            {[500, 1000, 3000].map((amt) => (
              <button
                key={amt}
                onClick={() => handleDeposit(amt)}
                className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-300 font-mono font-bold border border-white/10 hover:border-amber-500/50 transition cursor-pointer text-center"
              >
                +{amt} ₽
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              placeholder="Своя сумма ₽..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => handleDeposit(Number(customAmount))}
              disabled={!customAmount || Number(customAmount) <= 0}
              className="px-3 py-1.5 rounded-xl bg-amber-500 disabled:opacity-40 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Ок</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
