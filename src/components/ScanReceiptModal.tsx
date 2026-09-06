import React, { useState } from "react";
import { Camera, X, Scan, Check, FileText, Upload, Sparkles } from "lucide-react";
import { ParsedExpense } from "../types";

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (parsed: ParsedExpense) => void;
  activeMember: string;
}

interface SampleReceipt {
  store: string;
  category: any;
  total: number;
  items: { name: string; price: number }[];
}

const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    store: "Супермаркет 'Ашан'",
    category: "Продукты",
    total: 3450,
    items: [
      { name: "Молоко Домик в Деревне 3.2%", price: 95 },
      { name: "Хлеб Бородинский", price: 55 },
      { name: "Сыр Российский 400г", price: 420 },
      { name: "Филе индейки 1кг", price: 580 },
      { name: "Овощи и фрукты (набор)", price: 850 },
      { name: "Прочие продукты", price: 1450 },
    ],
  },
  {
    store: "Сеть 'Аптека 36.6'",
    category: "Здоровье",
    total: 1200,
    items: [
      { name: "Витамин C 1000мг", price: 450 },
      { name: "Капли для носа", price: 320 },
      { name: "Пластырь медицинский", price: 180 },
      { name: "Антисептик 250мл", price: 250 },
    ],
  },
  {
    store: "Семейный Магнит",
    category: "Продукты",
    total: 890,
    items: [
      { name: "Кофе растворимый Jacobs", price: 490 },
      { name: "Шоколад Аленка 2x", price: 180 },
      { name: "Сок Яблочный 1л", price: 220 },
    ],
  },
];

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  activeMember,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SampleReceipt | null>(
    null
  );

  if (!isOpen) return null;

  const handleScanSample = (receipt: SampleReceipt) => {
    setIsScanning(true);
    setSelectedReceipt(null);
    setTimeout(() => {
      setIsScanning(false);
      setSelectedReceipt(receipt);
    }, 1800);
  };

  const handleConfirm = () => {
    if (selectedReceipt) {
      onAddExpense({
        amount: selectedReceipt.total,
        category: selectedReceipt.category,
        name: selectedReceipt.store,
        member: activeMember,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 border border-slate-700 cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">
            Сканер чеков и QR-кодов
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Наведите камеру на QR-код чека для автоматической детализации
        </p>

        {/* Camera Viewfinder View */}
        <div className="w-full h-48 bg-slate-950 rounded-2xl border-2 border-dashed border-emerald-500/40 relative overflow-hidden flex flex-col items-center justify-center mb-4">
          {/* Laser Scanning Animation */}
          {isScanning ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/40">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-bounce my-auto" />
              <span className="text-xs font-semibold text-emerald-300 animate-pulse mt-auto mb-4">
                🔍 AI сканирует QR-код чека ФНС...
              </span>
            </div>
          ) : selectedReceipt ? (
            <div className="p-4 text-center">
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mb-1">
                <Check className="w-4 h-4" />
                Чек успешно распознан!
              </div>
              <div className="text-base font-extrabold text-white">
                {selectedReceipt.store}
              </div>
              <div className="text-lg font-mono font-bold text-emerald-300 mt-1">
                {selectedReceipt.total} ₽
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <Scan className="w-10 h-10 text-emerald-400/60 mx-auto mb-2 animate-pulse" />
              <div className="text-xs text-slate-400 font-medium">
                Нажмите на образцы чеков ниже для сканирования
              </div>
            </div>
          )}

          {/* Corner Viewfinder Guidelines */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
        </div>

        {/* Selected Receipt Itemized Detail List */}
        {selectedReceipt && !isScanning && (
          <div className="mb-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 max-h-36 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
              <span>Содержимое чека:</span>
              <span className="text-emerald-400">
                {selectedReceipt.items.length} поз.
              </span>
            </div>
            <div className="space-y-1">
              {selectedReceipt.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-900 pb-1"
                >
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="font-mono text-slate-100 font-medium">
                    {item.price} ₽
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Receipts Quick Selector Buttons */}
        <div className="mb-4 text-left">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
            Симуляция сканирования чеков:
          </div>
          <div className="space-y-1.5">
            {SAMPLE_RECEIPTS.map((r, i) => (
              <button
                key={i}
                onClick={() => handleScanSample(r)}
                className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 flex items-center justify-between transition cursor-pointer border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">{r.store}</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  {r.total} ₽
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Action */}
        {selectedReceipt && !isScanning && (
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Занести чек ({selectedReceipt.total} ₽)</span>
          </button>
        )}
      </div>
    </div>
  );
};
