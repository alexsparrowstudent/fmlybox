import React, { useState, useEffect } from "react";
import { Smartphone, Maximize2, Minimize2, Wifi, Battery, Signal } from "lucide-react";

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  todayCount?: number;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  todayCount = 0,
}) => {
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 font-sans flex flex-col items-center justify-center p-0 md:p-4 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Toggle Control for Mobile Frame vs Responsive Full View */}
      <div className="w-full max-w-md hidden md:flex justify-between items-center mb-3 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">SafeDay Android Prototype</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
            OLED HUD v2.5
          </span>
        </div>
        <button
          onClick={() => setIsFrameMode(!isFrameMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition border border-slate-700 cursor-pointer"
          title="Переключить рамку Android"
        >
          {isFrameMode ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Во весь экран</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Вид Android</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isFrameMode
            ? "max-w-[420px] h-[880px] max-h-[95vh] rounded-[42px] border-[10px] border-slate-800 shadow-[0_0_50px_rgba(15,23,42,0.9)] bg-[#0B0F19] flex flex-col overflow-hidden relative ring-1 ring-slate-700/50"
            : "max-w-4xl min-h-screen md:min-h-[850px] md:rounded-3xl border border-slate-800/80 bg-[#0B0F19] flex flex-col overflow-hidden shadow-2xl relative"
        }`}
      >
        {/* Android Status Bar */}
        <div className="w-full h-9 px-6 pt-2 bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-between text-xs font-medium text-slate-300 z-30 select-none border-b border-slate-800/40">
          <span className="font-mono text-emerald-400 tracking-tight">{time || "12:45"}</span>
          {/* Top Notch / Camera Cutout */}
          <div className="w-24 h-4 bg-slate-900 rounded-b-xl border-x border-b border-slate-800/80 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-0.5 text-[10px] font-mono text-emerald-400">
              <span>98%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Screen Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {children}
        </div>

        {/* Android Bottom Navigation Bar */}
        <div className="w-full bg-[#0B0F19]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2.5 flex justify-around items-center z-30 select-none shadow-lg">
          <button
            onClick={() => onTabChange("dashboard")}
            className={`flex flex-col items-center gap-1 transition-all px-3 py-1.5 rounded-xl cursor-pointer ${
              activeTab === "dashboard"
                ? "text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-lg">📊</span>
            <span className="text-[11px] font-medium leading-none">Главная</span>
          </button>

          <button
            onClick={() => onTabChange("budget")}
            className={`flex flex-col items-center gap-1 transition-all px-3 py-1.5 rounded-xl cursor-pointer ${
              activeTab === "budget"
                ? "text-sky-400 bg-sky-950/40 border border-sky-500/30 scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span className="text-[11px] font-medium leading-none">Бюджет</span>
          </button>

          <button
            onClick={() => onTabChange("analytics")}
            className={`flex flex-col items-center gap-1 transition-all px-3 py-1.5 rounded-xl cursor-pointer ${
              activeTab === "analytics"
                ? "text-purple-400 bg-purple-950/40 border border-purple-500/30 scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-lg">📈</span>
            <span className="text-[11px] font-medium leading-none">Аналитика</span>
          </button>

          <button
            onClick={() => onTabChange("family")}
            className={`flex flex-col items-center gap-1 transition-all px-3 py-1.5 rounded-xl cursor-pointer relative ${
              activeTab === "family"
                ? "text-amber-400 bg-amber-950/40 border border-amber-500/30 scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-lg">👨‍👩‍👧</span>
            <span className="text-[11px] font-medium leading-none">Семья</span>
            {todayCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                {todayCount}
              </span>
            )}
          </button>
        </div>

        {/* Android Gesture Bar */}
        <div className="w-full h-4 bg-[#0B0F19] flex justify-center items-center pb-1">
          <div className="w-32 h-1 bg-slate-700/70 rounded-full" />
        </div>
      </div>
    </div>
  );
};
