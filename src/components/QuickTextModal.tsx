import React, { useState, useEffect } from "react";
import { X, Keyboard, Sparkles, Check } from "lucide-react";
import { CategoryType, ParsedExpense } from "../types";
import { getCategoryInfo } from "../utils/financial";

interface QuickTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (parsed: ParsedExpense) => void;
  activeMember: string;
}

const CATEGORIES: CategoryType[] = [
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

export const QuickTextModal: React.FC<QuickTextModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  activeMember,
}) => {
  const [textInput, setTextInput] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<CategoryType>("Продукты");
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTextInput("");
      setAmount(0);
      setCategory("Продукты");
      setName("");
    }
  }, [isOpen]);

  // Live Smart Auto-Parser on text input change
  useEffect(() => {
    if (!textInput.trim()) {
      setAmount(0);
      setName("");
      return;
    }

    const clean = textInput.toLowerCase();
    const numbers = clean.match(/\d+(\s*\d+)*/g);
    if (numbers && numbers.length > 0) {
      const parsedAmount = parseInt(numbers[0].replace(/\s+/g, ""), 10);
      setAmount(parsedAmount);
    } else {
      setAmount(0);
    }

    // Auto category detection
    if (/аптек|лекарств|врач|больниц|витамин/.test(clean)) {
      setCategory("Здоровье");
    } else if (/заправк|бензин|такси|метро|авто|парковк|машин/.test(clean)) {
      setCategory("Транспорт");
    } else if (/продукт|магнит|пятерочк|перекресток|ашан|лента|вкуссвилл|еда|молоко/.test(clean)) {
      setCategory("Продукты");
    } else if (/кафе|ресторан|кофе|обед|ужин|пицца|суши|бургер/.test(clean)) {
      setCategory("Кафе и Еда");
    } else if (/сад|садик|игрушк|подгузник|детск|ребенок/.test(clean)) {
      setCategory("Дети");
    } else if (/жкх|ипотек|аренд|коммунал|электричеств|газ|интернет/.test(clean)) {
      setCategory("Дом и ЖКХ");
    } else if (/кино|театр|концерт|игра|подписк/.test(clean)) {
      setCategory("Развлечения");
    } else if (/одежд|обувь|сумк|подарок|озон|ozon|вайлдберри/.test(clean)) {
      setCategory("Покупки");
    }

    const nameWithoutNumbers = textInput.replace(/\d+/g, "").trim();
    setName(nameWithoutNumbers || category);
  }, [textInput]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    onAddExpense({
      amount,
      category,
      name: name || category,
      member: activeMember,
    });
    onClose();
  };

  const catInfo = getCategoryInfo(category);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 border border-slate-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <Keyboard className="w-4 h-4 text-sky-400" />
          <h3 className="text-base font-bold text-slate-100">Мгновенный ввод расхода</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Наберите одной строкой, например: <span className="text-sky-300">"1200 аптека"</span> или <span className="text-emerald-300">"350 кофе"</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Input Field */}
          <div className="relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="1200 аптека..."
              autoFocus
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 font-medium text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-inner"
            />
            {textInput && (
              <button
                type="button"
                onClick={() => setTextInput("")}
                className="absolute right-3 top-3.5 text-xs text-slate-500 hover:text-slate-300"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Parsed Preview Card */}
          <div className={`p-3.5 rounded-2xl ${catInfo.bgColor} border ${catInfo.borderColor} flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{catInfo.icon}</span>
              <div>
                <div className="text-xs font-bold text-white">
                  {name || "Введите описание"}
                </div>
                <div className={`text-[11px] font-medium ${catInfo.color}`}>
                  {category}
                </div>
              </div>
            </div>
            <div className="text-right font-mono font-extrabold text-base text-emerald-400">
              {amount > 0 ? `${amount} ₽` : "0 ₽"}
            </div>
          </div>

          {/* Quick Category Selector Chips */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 block">
              Категория расхода:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => {
                const info = getCategoryInfo(cat);
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1 transition cursor-pointer border ${
                      isSelected
                        ? "bg-slate-800 text-white border-sky-400 shadow-sm"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={amount <= 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 disabled:opacity-40 text-slate-950 font-bold text-sm shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Внести расход ({amount} ₽)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
