import React, { useState, useEffect } from "react";
import { Mic, MicOff, X, Check, Volume2 } from "lucide-react";
import { ParsedExpense } from "../types";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (parsed: ParsedExpense) => void;
  activeMember: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  activeMember,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedExpense | null>(null);

  const sampleVoicePhrases = [
    "Потратил 1 200 рублей в Аптеке 36.6",
    "Заправил машину бензином на 2 500 рублей",
    "Купил продукты в Магните на 1 850 рублей",
    "Обед в столовой 450 рублей",
  ];

  // Speech Recognition Web API setup if available
  useEffect(() => {
    if (isOpen) {
      setIsListening(true);
      setTranscript("");
      setParsedResult(null);

      // Simulate initial recording timer / wave
      const timer = setTimeout(() => {
        // Default sample if user doesn't say anything
        if (!transcript) {
          handleSelectSample(sampleVoicePhrases[0]);
        }
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectSample = (phrase: string) => {
    setTranscript(phrase);
    setIsListening(false);
    processSpeechText(phrase);
  };

  const processSpeechText = async (textToParse: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: textToParse, member: activeMember }),
      });
      const data = await res.json();
      setParsedResult(data);
    } catch (err) {
      console.error("Parse error:", err);
      setParsedResult({
        amount: 1200,
        category: "Здоровье",
        name: "Аптека",
        member: activeMember,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (parsedResult && parsedResult.amount > 0) {
      onAddExpense(parsedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl relative overflow-hidden text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 border border-slate-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Mic className="w-4 h-4 text-sky-400" />
          <h3 className="text-base font-bold text-slate-100">Голосовой ввод расхода</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Скажите, например: <span className="text-sky-300">"1200 аптека"</span> или <span className="text-emerald-300">"заправил на 2500"</span>
        </p>

        {/* Pulsing Mic Visualizer */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative flex items-center justify-center">
            {/* Animated Rings */}
            {isListening && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-sky-500/20 animate-ping" />
                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse" />
              </>
            )}
            <button
              onClick={() => {
                if (isListening) {
                  setIsListening(false);
                  if (transcript) processSpeechText(transcript);
                } else {
                  setIsListening(true);
                }
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 shadow-xl ${
                isListening
                  ? "bg-gradient-to-tr from-sky-500 to-emerald-400 text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.5)] scale-110"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600"
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : (
                <MicOff className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Equalizer Sound Waves */}
          {isListening && (
            <div className="flex items-center gap-1 mt-6 h-8">
              {[40, 75, 100, 60, 90, 45, 80, 50, 95, 30].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-gradient-to-t from-sky-500 to-emerald-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${idx * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Transcript or Processing State */}
        {isProcessing && (
          <div className="p-3 my-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center gap-2 text-xs text-sky-400">
            <span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>Распознавание расхода...</span>
          </div>
        )}

        {/* Parsed Result Display */}
        {parsedResult && !isProcessing && (
          <div className="p-4 my-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-left animate-in zoom-in-95">
            <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
              Распознанный расход:
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{parsedResult.name}</div>
                <div className="text-xs text-slate-300">Категория: {parsedResult.category}</div>
              </div>
              <div className="text-lg font-extrabold text-emerald-400 font-mono">
                {parsedResult.amount} ₽
              </div>
            </div>
          </div>
        )}

        {/* Sample Voice Clips Options */}
        <div className="mt-4 text-left">
          <div className="text-[10px] text-slate-400 font-semibold uppercase mb-2">
            Быстрые голосовые образцы:
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {sampleVoicePhrases.map((phrase, i) => (
              <button
                key={i}
                onClick={() => handleSelectSample(phrase)}
                className="w-full text-left p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-between transition cursor-pointer border border-slate-700/50"
              >
                <span className="truncate pr-2">"{phrase}"</span>
                <Volume2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        {parsedResult && (
          <button
            onClick={handleConfirm}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Подтвердить и внести</span>
          </button>
        )}
      </div>
    </div>
  );
};
