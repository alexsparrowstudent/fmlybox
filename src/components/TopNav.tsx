import React, { useState } from "react";
import { Bell, ShieldCheck, Check, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { NetworkStatus } from "../services/syncService";
import { FamilyMember } from "../types";

interface TopNavProps {
  activeMember: string;
  onMemberChange: (member: string) => void;
  onTriggerPushNotif: () => void;
  networkStatus?: NetworkStatus;
  pendingQueueCount?: number;
  onManualSync?: () => void;
  familyMembers?: FamilyMember[];
}

export const TopNav: React.FC<TopNavProps> = ({
  activeMember,
  onMemberChange,
  onTriggerPushNotif,
  networkStatus = "online",
  pendingQueueCount = 0,
  onManualSync,
  familyMembers = [],
}) => {
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);

  const displayMembers = [
    { name: "Вся семья", avatar: "👨‍👩‍👧‍👦", role: "Общий бюджет" },
    ...familyMembers.map((m) => ({
      name: m.name,
      avatar: m.avatar || "👤",
      role: m.role === "admin" ? "Администратор" : "Участник",
    })),
  ];

  return (
    <div className="w-full px-4 py-3 bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-800/60 sticky top-0 z-20 flex items-center justify-between">
      {/* Brand & Safe Shield */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-400 p-0.5 shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-sky-400 bg-clip-text text-transparent">
              SafeDay
            </h1>
            
            {/* Network Sync Status Badge */}
            <button
              onClick={onManualSync}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 transition cursor-pointer ${
                networkStatus === "syncing"
                  ? "text-sky-300 bg-sky-500/10 border-sky-500/30"
                  : networkStatus === "offline"
                  ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              }`}
              title={
                networkStatus === "offline"
                  ? `Оффлайн режим (${pendingQueueCount} в очереди)`
                  : networkStatus === "syncing"
                  ? "Синхронизация с сервером..."
                  : "Синхронизировано с VDS"
              }
            >
              {networkStatus === "syncing" ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-sky-400" />
                  <span>Синхр...</span>
                </>
              ) : networkStatus === "offline" ? (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                  <span>Оффлайн {pendingQueueCount > 0 ? `(${pendingQueueCount})` : ""}</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#4ade80]" />
                  <span>VDS Live</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Семейный финансовый навигатор</p>
        </div>
      </div>

      {/* Family Member Switcher & Notifications */}
      <div className="flex items-center gap-2 relative">
        {/* Member Selector Button */}
        <button
          onClick={() => setIsMemberMenuOpen(!isMemberMenuOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-slate-600 text-xs font-medium text-slate-200 transition cursor-pointer"
        >
          <span className="text-sm">
            {displayMembers.find((m) => m.name === activeMember)?.avatar || "👤"}
          </span>
          <span className="max-w-[70px] truncate">{activeMember}</span>
          <span className="text-[10px] text-slate-400">▼</span>
        </button>

        {/* Member Selector Dropdown */}
        {isMemberMenuOpen && (
          <div className="absolute right-10 top-12 w-48 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              Выбор профиля семьи
            </div>
            {displayMembers.map((m) => (
              <button
                key={m.name}
                onClick={() => {
                  onMemberChange(m.name);
                  setIsMemberMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer my-0.5 ${
                  activeMember === m.name
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{m.avatar}</span>
                  <div className="text-left">
                    <div className="font-semibold text-slate-100">{m.name}</div>
                    <div className="text-[9px] text-slate-400">{m.role}</div>
                  </div>
                </div>
                {activeMember === m.name && (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Push Notification Trigger Simulation */}
        <button
          onClick={onTriggerPushNotif}
          className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition cursor-pointer relative"
          title="Симуляция Android Push-уведомления"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>
    </div>
  );
};

