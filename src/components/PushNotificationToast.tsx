import React, { useEffect } from "react";
import { Bell, ShieldCheck, X } from "lucide-react";

interface PushNotificationToastProps {
  message: string;
  onClose: () => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  message,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="absolute top-10 left-3 right-3 z-50 animate-in slide-in-from-top-6 duration-300">
      <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-start gap-3 relative">
        <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>

        <div className="flex-1 pr-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              SafeDay • Android Push
            </span>
            <span className="text-[9px] text-slate-500">сейчас</span>
          </div>
          <div className="text-xs font-semibold text-slate-100 mt-0.5 leading-snug">
            {message}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white p-1 rounded-full cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
