import React from "react";
import { formatRubles, formatNumber } from "../utils/financial";
import { Sparkles, Calendar, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

interface FinancialSpeedometerProps {
  safeDailyLimit: number;
  todaySpent: number;
  daysToSalary: number;
  mandatoryPaidPercent: number;
  safeZoneStatus: "safe" | "warning" | "exceeded";
  onQuickAdd: () => void;
}

export const FinancialSpeedometer: React.FC<FinancialSpeedometerProps> = ({
  safeDailyLimit,
  todaySpent,
  daysToSalary,
  mandatoryPaidPercent,
  safeZoneStatus,
  onQuickAdd,
}) => {
  const remainingToday = safeDailyLimit - todaySpent;
  const spentPercent = safeDailyLimit > 0 ? Math.min(Math.round((todaySpent / safeDailyLimit) * 100), 100) : 0;

  // Status styling
  let statusBadge = {
    text: "Безопасная зона",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    glowColor: "rgba(74, 222, 128, 0.25)",
    ringColor: "border-emerald-400",
    barColor: "from-emerald-400 to-teal-400",
  };

  if (safeZoneStatus === "warning") {
    statusBadge = {
      text: "Близко к лимиту",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      glowColor: "rgba(251, 191, 36, 0.25)",
      ringColor: "border-amber-400",
      barColor: "from-amber-400 to-yellow-400",
    };
  } else if (safeZoneStatus === "exceeded") {
    statusBadge = {
      text: "Перерасход дня",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      glowColor: "rgba(239, 68, 68, 0.3)",
      ringColor: "border-rose-500",
      barColor: "from-rose-500 to-red-600",
    };
  }

  return (
    <div className="w-full p-5 rounded-[28px] bg-slate-900/60 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl transition-all duration-300">
      {/* Background radial ambient light */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* Top Header Label & Bento Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#4ade80]" />
          <span className="text-xs font-bold uppercase tracking-[2px] text-slate-400">
            Safe to Spend
          </span>
        </div>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border backdrop-blur-md ${statusBadge.color}`}>
          {statusBadge.text}
        </span>
      </div>

      {/* Hero Bento Gauge Ring */}
      <div className="flex flex-col items-center justify-center my-3 relative">
        <div
          className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full border-8 border-slate-800/80 ${statusBadge.ringColor} border-t-emerald-400 flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(74,222,128,0.15)] bg-slate-950/40 backdrop-blur-md transition-all duration-500`}
          style={{
            borderTopColor: safeZoneStatus === "exceeded" ? "#EF4444" : safeZoneStatus === "warning" ? "#FBBF24" : "#4ADE80",
          }}
        >
          <span className="text-[11px] uppercase tracking-[2px] font-bold text-slate-400 mb-1">
            Дневной Лимит
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-400 drop-shadow-[0_0_25px_rgba(74,222,128,0.4)] font-mono">
            {formatRubles(safeDailyLimit)}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-1">
            {remainingToday < 0
              ? `Перерасход: ${formatRubles(Math.abs(remainingToday))}`
              : `Осталось: ${formatRubles(remainingToday)}`}
          </span>
        </div>
      </div>

      {/* Today's Spend HUD Bar */}
      <div className="my-4 bg-slate-950/60 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex justify-between items-center text-xs font-medium mb-2">
          <span className="text-slate-300 flex items-center gap-1.5 font-semibold">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>Потрачено сегодня:</span>
          </span>
          <span className="font-mono text-slate-100 font-bold text-sm">
            {formatRubles(todaySpent)} <span className="text-slate-500 text-xs">/ {formatRubles(safeDailyLimit)}</span>
          </span>
        </div>

        {/* HUD Bento Progress Bar */}
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${statusBadge.barColor} transition-all duration-500 shadow-[0_0_12px_rgba(74,222,128,0.5)]`}
            style={{ width: `${spentPercent}%` }}
          />
        </div>
      </div>

      {/* Info Metric Tiles */}
      <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-slate-300 font-medium">
        <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-2xl border border-white/5">
          <span className="text-slate-400 text-[11px]">Дней до аванса/ЗП</span>
          <strong className="text-sky-400 font-mono text-sm font-bold">{daysToSalary} дн.</strong>
        </div>

        <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-2xl border border-white/5">
          <span className="text-slate-400 text-[11px]">Обязат. платежи</span>
          <strong className="text-emerald-400 font-mono text-sm font-bold">{mandatoryPaidPercent}%</strong>
        </div>
      </div>
    </div>
  );
};
