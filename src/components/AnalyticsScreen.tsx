import React, { useState } from "react";
import { Transaction, CategoryType, FamilyMember } from "../types";
import { formatRubles, getCategoryInfo, CATEGORIES } from "../utils/financial";
import {
  BarChart3,
  Search,
  PieChart,
  CreditCard,
  Flame,
  FileSpreadsheet,
  Download,
  Users,
  Pencil,
  Trash2,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { exportTransactionsToCSV, exportDatabaseToJSON } from "../utils/exportImport";
import { EditTransactionModal } from "./EditTransactionModal";
import { FamilyAppData } from "../services/syncService";

interface AnalyticsScreenProps {
  transactions: Transaction[];
  familyMembers: FamilyMember[];
  income: number;
  mandatoryTotal: number;
  safeLimit: number;
  todaySpent: number;
  onUpdateTransaction: (updated: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  fullAppData?: FamilyAppData;
}

// Category palette for pie/donut chart
const CATEGORY_COLORS: Record<string, string> = {
  Продукты: "#10b981", // emerald
  Транспорт: "#38bdf8", // sky
  "Кафе и Еда": "#f59e0b", // amber
  Дети: "#ec4899", // pink
  Здоровье: "#ef4444", // rose
  Развлечения: "#a855f7", // purple
  "Дом и ЖКХ": "#6366f1", // indigo
  Покупки: "#14b8a6", // teal
  Прочее: "#64748b", // slate
};

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  transactions,
  familyMembers,
  safeLimit,
  onUpdateTransaction,
  onDeleteTransaction,
  fullAppData,
}) => {
  const [timeMode, setTimeMode] = useState<"week" | "month" | "all">("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit modal state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter transactions by time
  const now = new Date();
  const filteredByTime = transactions.filter((t) => {
    if (timeMode === "all") return true;
    const txDate = new Date(t.date);
    const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
    if (timeMode === "week") return diffDays <= 7;
    if (timeMode === "month") return diffDays <= 30;
    return true;
  });

  // Calculate breakdown per category
  const categoryTotals: Record<string, number> = {};
  let grandTotal = 0;

  // Breakdown per family member
  const memberTotals: Record<string, { total: number; count: number }> = {};

  filteredByTime.forEach((t) => {
    // Member metrics
    const mem = t.member || "Не указан";
    if (!memberTotals[mem]) {
      memberTotals[mem] = { total: 0, count: 0 };
    }
    memberTotals[mem].total += t.amount;
    memberTotals[mem].count += 1;

    // Category metrics with member filter applied
    if (selectedMember === "all" || t.member === selectedMember) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      grandTotal += t.amount;
    }
  });

  const sortedCategories = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a
  );

  const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : "—";
  const avgCheck =
    filteredByTime.length > 0 ? Math.round(grandTotal / filteredByTime.length) : 0;

  // Filtered transactions for the search & table view
  const filteredHistory = filteredByTime.filter((t) => {
    const matchesCat =
      selectedCategory === "all" || t.category === selectedCategory;
    const matchesMember =
      selectedMember === "all" || t.member === selectedMember;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.amount).includes(searchQuery);
    return matchesCat && matchesMember && matchesSearch;
  });

  // Build SVG Pie / Donut Chart Segments
  let cumulativeAngle = 0;
  const pieSegments = sortedCategories.map(([catName, amt]) => {
    const fraction = grandTotal > 0 ? amt / grandTotal : 0;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + fraction * 360;
    cumulativeAngle = endAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const radius = 40;
    const innerRadius = 26;
    const cx = 50;
    const cy = 50;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    const largeArc = fraction > 0.5 ? 1 : 0;

    const pathData =
      fraction >= 0.999
        ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} M ${cx} ${cy - innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy + innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy - innerRadius} Z`
        : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    const color = CATEGORY_COLORS[catName] || "#818cf8";

    return {
      category: catName,
      amount: amt,
      fraction,
      percent: Math.round(fraction * 100),
      pathData,
      color,
    };
  });

  const handleExportCSV = () => {
    exportTransactionsToCSV(
      filteredHistory.length > 0 ? filteredHistory : transactions
    );
    showToast("Файл CSV скачан для Excel!");
  };

  const handleExportJSON = () => {
    if (fullAppData) {
      exportDatabaseToJSON(fullAppData);
      showToast("Резервная копия JSON сохранена!");
    }
  };

  return (
    <div className="w-full p-4 space-y-4 animate-in fade-in pb-20">
      {/* Screen Title & Time Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>Аналитика и Графики</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Круговая диаграмма, доли семьи и экспорт
          </p>
        </div>

        {/* Time Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/10 text-[11px] font-bold">
          <button
            onClick={() => setTimeMode("week")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              timeMode === "week"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            7 дней
          </button>
          <button
            onClick={() => setTimeMode("month")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              timeMode === "month"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Месяц
          </button>
          <button
            onClick={() => setTimeMode("all")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              timeMode === "all"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Все
          </button>
        </div>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
            <CreditCard className="w-3 h-3 text-emerald-400" />
            <span>Всего трат</span>
          </div>
          <div className="text-sm font-extrabold text-emerald-400 font-mono truncate">
            {formatRubles(grandTotal)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Топ-статья</span>
          </div>
          <div className="text-xs font-bold text-amber-300 truncate">
            {topCategory}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
            <span>📊</span>
            <span>Ср. чек</span>
          </div>
          <div className="text-xs font-extrabold text-sky-400 font-mono truncate">
            {formatRubles(avgCheck)}
          </div>
        </div>
      </div>

      {/* Interactive Pie / Donut Chart & Category Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-200 tracking-wider flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-sky-400" />
            <span>Круговая диаграмма расходов</span>
          </h3>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            {sortedCategories.length} категорий
          </span>
        </div>

        {sortedCategories.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Нет расходов за выбранный период
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* SVG Donut */}
            <div className="flex flex-col items-center justify-center relative py-2">
              <svg viewBox="0 0 100 100" className="w-36 h-36 drop-shadow-md">
                {pieSegments.map((seg) => (
                  <path
                    key={seg.category}
                    d={seg.pathData}
                    fill={seg.color}
                    className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                    onClick={() => {
                      setSelectedCategory(
                        selectedCategory === seg.category ? "all" : seg.category
                      );
                    }}
                  >
                    <title>{`${seg.category}: ${formatRubles(seg.amount)} (${seg.percent}%)`}</title>
                  </path>
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  {selectedCategory === "all" ? "Итого" : selectedCategory}
                </span>
                <span className="text-xs font-mono font-extrabold text-white">
                  {selectedCategory === "all"
                    ? formatRubles(grandTotal)
                    : formatRubles(categoryTotals[selectedCategory] || 0)}
                </span>
              </div>
            </div>

            {/* Category Bars & Click to Filter */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sortedCategories.map(([catName, amt]) => {
                const catInfo = getCategoryInfo(catName as CategoryType);
                const percent = grandTotal > 0 ? Math.round((amt / grandTotal) * 100) : 0;
                const isFiltered = selectedCategory === catName;
                const segColor = CATEGORY_COLORS[catName] || "#38bdf8";

                return (
                  <div
                    key={catName}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === catName ? "all" : catName
                      )
                    }
                    className={`p-1.5 rounded-xl border transition cursor-pointer space-y-1 ${
                      isFiltered
                        ? "bg-sky-500/20 border-sky-400 shadow-sm"
                        : "bg-slate-950/50 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: segColor }}
                        />
                        <span>{catInfo.icon}</span>
                        <span className="truncate">{catName}</span>
                      </div>
                      <div className="font-mono text-slate-300 text-xs">
                        <strong>{formatRubles(amt)}</strong>{" "}
                        <span className="text-slate-500 text-[10px]">({percent}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: segColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Family Members Spending Comparison */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Расходы по членам семьи</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {Object.keys(memberTotals).length} участников
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Object.entries(memberTotals).map(([memName, stats]) => {
            const memberObj = familyMembers.find((m) => m.name === memName);
            const avatar = memberObj?.avatar || "👤";
            const percent = grandTotal > 0 ? Math.round((stats.total / grandTotal) * 100) : 0;
            const avgPerCheck = stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
            const isSelected = selectedMember === memName;

            return (
              <div
                key={memName}
                onClick={() =>
                  setSelectedMember(selectedMember === memName ? "all" : memName)
                }
                className={`p-3 rounded-2xl border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? "bg-amber-500/10 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "bg-slate-950/60 border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1 rounded-xl bg-slate-800 border border-white/10">
                      {avatar}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-white">{memName}</div>
                      <div className="text-[10px] text-slate-400">
                        {stats.count} {stats.count === 1 ? "чек" : "чеков"} • ср. {formatRubles(avgPerCheck)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-extrabold text-amber-300">
                      {formatRubles(stats.total)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">{percent}% от всех трат</div>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export & Backup Action Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 border border-purple-500/20 backdrop-blur-md space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
            <Download className="w-4 h-4 text-purple-400" />
            <span>Экспорт данных и отчёты</span>
          </h3>
        </div>

        <p className="text-[11px] text-slate-400">
          Выгружайте списки покупок в Excel для бухгалтерского анализа или сохраняйте полный резервный JSON-файл:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Экспорт в Excel (CSV)</span>
          </button>

          {/* Export JSON Backup */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Бэкап в JSON</span>
          </button>
        </div>
      </div>

      {/* Detailed Transaction History Search, Filter & EDIT */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md space-y-3 shadow-lg">
        <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-300 tracking-wider">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>Журнал операций (Редактирование)</span>
          </span>
          <span className="text-slate-500 font-mono text-[10px]">
            Найдено: {filteredHistory.length}
          </span>
        </div>

        {/* Search & Filter row */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Поиск по названию, сумме или автору..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Все категории</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Member Filter */}
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="px-2 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Вся семья</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.avatar} {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtered History Items with Edit / Delete Actions */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Транзакции не найдены
            </div>
          ) : (
            filteredHistory.map((t) => {
              const catInfo = getCategoryInfo(t.category);
              return (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs hover:border-white/20 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{catInfo.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 truncate">{t.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>{t.date}</span>
                        <span>•</span>
                        <span className="text-sky-300 font-semibold">{t.member}</span>
                        <span>•</span>
                        <span className="text-slate-500">{t.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-mono font-bold text-rose-400 text-xs">
                      -{formatRubles(t.amount)}
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => setEditingTransaction(t)}
                      className="p-1 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 border border-white/5 hover:border-sky-400/40 transition cursor-pointer"
                      title="Редактировать расход"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Удалить "${t.name}" (${t.amount} ₽)?`)) {
                          onDeleteTransaction(t.id);
                        }
                      }}
                      className="p-1 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/40 transition cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        familyMembers={familyMembers}
        onClose={() => setEditingTransaction(null)}
        onSave={(updated) => {
          onUpdateTransaction(updated);
          showToast(`Расход «${updated.name}» обновлен!`);
        }}
        onDelete={(id) => {
          onDeleteTransaction(id);
          showToast("Расход удален!");
        }}
      />
    </div>
  );
};
