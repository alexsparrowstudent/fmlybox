import React from "react";
import { Mic, Keyboard, Camera, Plus } from "lucide-react";

interface QuickActionBarProps {
  onOpenVoice: () => void;
  onOpenText: () => void;
  onOpenScan: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onOpenVoice,
  onOpenText,
  onOpenScan,
}) => {
  return (
    <div className="w-full my-4 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl shadow-xl flex items-center justify-around gap-1.5">
      {/* Voice Button */}
      <button
        onClick={onOpenVoice}
        className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-b from-sky-950/80 to-slate-900 hover:from-sky-900/80 text-sky-300 border border-sky-500/30 flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md group"
      >
        <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition">
          <Mic className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold leading-tight">🎙️ Голос</span>
      </button>

      {/* Text Button */}
      <button
        onClick={onOpenText}
        className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-b from-emerald-950/80 to-slate-900 hover:from-emerald-900/80 text-emerald-300 border border-emerald-500/30 flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md group"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
          <Keyboard className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold leading-tight">⌨️ Текст</span>
      </button>

      {/* Scan Receipt Button */}
      <button
        onClick={onOpenScan}
        className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-b from-purple-950/80 to-slate-900 hover:from-purple-900/80 text-purple-300 border border-purple-500/30 flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md group"
      >
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 transition">
          <Camera className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold leading-tight">📷 Чек</span>
      </button>
    </div>
  );
};
