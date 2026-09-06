import React, { useState, useEffect } from "react";
import { Transaction, CategoryType, FamilyMember } from "../types";
import { CATEGORIES, getCategoryInfo } from "../utils/financial";
import { X, Check, Trash2, Calendar, Clock, User, Tag, DollarSign } from "lucide-react";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  familyMembers: FamilyMember[];
  onClose: () => void;
  onSave: (updated: Transaction) => void;
  onDelete: (id: string) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  familyMembers,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !transaction) return null;

  const [name, setName] = useState(transaction.name);
  const [amount, setAmount] = useState<string>(String(transaction.amount));
  const [category, setCategory] = useState<CategoryType>(transaction.category);
  const [member, setMember] = useState<string>(transaction.member);
  const [date, setDate] = useState<string>(transaction.date);
  const [time, setTime] = useState<string>(transaction.time);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever transaction prop changes
  useEffect(() => {
    if (transaction) {
      setName(transaction.name);
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setMember(transaction.member);
      setDate(transaction.date);
      setTime(transaction.time);
      setError(null);
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name.trim()) {
      setError("Пожалуйста, введите название расхода");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Сумма должна быть больше 0 ₽");
      return;
    }

    onSave({
      ...transaction,
      name: name.trim(),
      amount: Math.round(numAmount),
      category,
      member,
      date,
      time,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("Удалить эту операцию?")) {
      onDelete(transaction.id);
      onClose();
    }
  };

  const currentCatInfo = getCategoryInfo(category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentCatInfo.icon}</span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Редактирование расхода</h3>
              <p className="text-[10px] text-slate-400">Изменение суммы, категории или автора</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Amount Input (Prominent) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Сумма расхода (₽)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-lg font-bold font-mono text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
                placeholder="0"
                required
                autoFocus
              />
              <span className="absolute right-3 top-3 text-xs text-slate-500 font-bold">₽</span>
            </div>
          </div>

          {/* Name / Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Название / Описание</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              placeholder="Например: Супермаркет или Кафе"
              required
            />
          </div>

          {/* Category Dropdown Grid */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              <span>Категория</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => {
                const info = getCategoryInfo(cat);
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? "bg-sky-500/20 border-sky-400 text-white shadow-sm"
                        : "bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="text-sm">{info.icon}</span>
                    <span className="truncate w-full text-center">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Family Member & Date row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Member Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-400" />
                <span>Кто оплатил</span>
              </label>
              <select
                value={member}
                onChange={(e) => setMember(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              >
                {familyMembers.length > 0 ? (
                  familyMembers.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.avatar} {m.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Алексей">👨‍💻 Алексей</option>
                    <option value="Мария">👩‍🎨 Мария</option>
                  </>
                )}
              </select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Дата</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleDelete}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
              title="Удалить расход"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
