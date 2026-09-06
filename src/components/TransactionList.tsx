import React from "react";
import { Transaction } from "../types";
import { getCategoryInfo, formatRubles } from "../utils/financial";
import { Trash2, Pencil, Mic, Keyboard, Camera, Clock } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  activeMemberFilter: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  activeMemberFilter,
}) => {
  const filtered = transactions.filter((t) => {
    if (activeMemberFilter === "Вся семья") return true;
    return t.member === activeMemberFilter;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayList = filtered.filter((t) => t.date === todayStr);
  const olderList = filtered.filter((t) => t.date !== todayStr);

  const renderSourceIcon = (source?: string) => {
    switch (source) {
      case "voice":
        return <Mic className="w-3 h-3 text-sky-400" title="Введено голосом" />;
      case "text":
        return <Keyboard className="w-3 h-3 text-emerald-400" title="Быстрый текст" />;
      case "receipt":
        return <Camera className="w-3 h-3 text-purple-400" title="Сканер чека" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full my-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Лента последних трат</span>
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          Всего: {filtered.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
          Пока нет транзакций. Используйте Голос, Текст или Чек выше!
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today Group */}
          {todayList.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Сегодня</span>
              </div>
              <div className="space-y-2">
                {todayList.map((t) => {
                  const cat = getCategoryInfo(t.category);
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl ${cat.bgColor} border ${cat.borderColor} flex items-center justify-center text-xl shrink-0`}
                        >
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 truncate">
                            <span className="truncate">{t.name}</span>
                            {renderSourceIcon(t.source)}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className={cat.color}>{t.category}</span>
                            <span>•</span>
                            <span>{t.time}</span>
                            <span>•</span>
                            <span className="text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded font-semibold">
                              {t.member}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-extrabold text-rose-400 font-mono">
                            -{formatRubles(t.amount)}
                          </div>
                        </div>
                        
                        {/* Quick Edit */}
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="text-slate-500 hover:text-sky-400 p-1.5 rounded-lg transition cursor-pointer"
                            title="Редактировать расход"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Удалить "${t.name}" (${t.amount} ₽)?`)) {
                              onDeleteTransaction(t.id);
                            }
                          }}
                          className="opacity-60 hover:opacity-100 text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Yesterday / Older Group */}
          {olderList.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Ранее
              </div>
              <div className="space-y-2">
                {olderList.map((t) => {
                  const cat = getCategoryInfo(t.category);
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl ${cat.bgColor} border ${cat.borderColor} flex items-center justify-center text-xl shrink-0 opacity-80`}
                        >
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 truncate">
                            <span className="truncate">{t.name}</span>
                            {renderSourceIcon(t.source)}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{t.category}</span>
                            <span>•</span>
                            <span>{t.date} {t.time}</span>
                            <span>•</span>
                            <span className="text-slate-300 bg-slate-800/80 px-1.5 py-0.2 rounded">
                              {t.member}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-xs font-bold text-slate-300 font-mono">
                          -{formatRubles(t.amount)}
                        </div>

                        {/* Quick Edit */}
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="text-slate-500 hover:text-sky-400 p-1.5 rounded-lg transition cursor-pointer"
                            title="Редактировать расход"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Удалить "${t.name}" (${t.amount} ₽)?`)) {
                              onDeleteTransaction(t.id);
                            }
                          }}
                          className="text-slate-600 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
