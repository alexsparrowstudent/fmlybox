import React, { useState, useRef } from "react";
import { Transaction, FamilyMember } from "../types";
import { formatRubles } from "../utils/financial";
import {
  Users,
  Bell,
  Smartphone,
  RotateCcw,
  Server,
  RefreshCw,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Shield,
  KeyRound,
  Sliders,
  Globe,
  Activity,
  HardDrive,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Radio,
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { NetworkStatus, testServerConnection, FamilyAppData } from "../services/syncService";
import { exportTransactionsToCSV, exportDatabaseToJSON, parseAndValidateBackup } from "../utils/exportImport";

interface FamilySettingsScreenProps {
  transactions: Transaction[];
  familyMembers: FamilyMember[];
  syncIntervalSeconds: number;
  familyCode: string;
  serverUrl?: string;
  syncMode?: "local_only" | "self_hosted";
  onAddMember: (name: string, role: "admin" | "member", avatar: string) => void;
  onDeleteMember: (id: string) => void;
  onUpdateSyncInterval: (seconds: number) => void;
  onUpdateServerConfig: (config: { serverUrl?: string; syncMode?: "local_only" | "self_hosted"; familyCode?: string }) => void;
  onTriggerPushNotif: () => void;
  onResetData: () => void;
  networkStatus?: NetworkStatus;
  pendingQueueCount?: number;
  lastSyncTime?: number;
  onManualSync?: () => void;
  fullAppData?: FamilyAppData;
  onRestoreBackup?: (data: FamilyAppData) => void;
}

const AVATAR_OPTIONS = ["👨‍💻", "👩‍🎨", "👧", "👦", "👵", "👴", "🦸‍♂️", "🧝‍♀️"];

export const FamilySettingsScreen: React.FC<FamilySettingsScreenProps> = ({
  transactions,
  familyMembers,
  syncIntervalSeconds,
  familyCode,
  serverUrl = "",
  syncMode = "self_hosted",
  onAddMember,
  onDeleteMember,
  onUpdateSyncInterval,
  onUpdateServerConfig,
  onTriggerPushNotif,
  onResetData,
  networkStatus = "online",
  pendingQueueCount = 0,
  lastSyncTime,
  onManualSync,
  fullAppData,
  onRestoreBackup,
}) => {
  const [notify80Percent, setNotify80Percent] = useState(true);
  const [dailyRecapNotif, setDailyRecapNotif] = useState(true);

  // Invite code copied toast state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showBackupToast = (msg: string) => {
    setBackupToast(msg);
    setTimeout(() => setBackupToast(null), 3000);
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions);
    showBackupToast("Таблица CSV успешно скачана!");
  };

  const handleExportJSON = () => {
    if (fullAppData) {
      exportDatabaseToJSON(fullAppData);
      showBackupToast("Резервная копия SafeDay (JSON) скачана!");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseAndValidateBackup(content);
      if (result.valid && result.data) {
        if (
          window.confirm(
            `Восстановить данные из файла? Будет загружено: ${result.data.transactions.length} чеков и ${result.data.familyMembers.length} участников.`
          )
        ) {
          if (onRestoreBackup) {
            onRestoreBackup(result.data);
            showBackupToast("Данные успешно восстановлены из резервной копии!");
            setBackupError(null);
          }
        }
      } else {
        setBackupError(result.error || "Некорректный файл бэкапа");
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  };

  // Add Member Modal / Form State
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState("👧");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");

  // Custom Server Configuration state
  const [inputServerUrl, setInputServerUrl] = useState(serverUrl);
  const [inputFamilyCode, setInputFamilyCode] = useState(familyCode || "SAFE-77");
  const [showDockerGuide, setShowDockerGuide] = useState(false);

  // Ping Testing State
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{
    tested: boolean;
    ok: boolean;
    pingMs: number;
    error?: string;
    serverApp?: string;
  } | null>(null);

  // Today's spend per family member
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTx = transactions.filter((t) => t.date === todayStr);

  const memberSpend: Record<string, number> = {};
  familyMembers.forEach((m) => {
    memberSpend[m.name] = 0;
  });

  todayTx.forEach((t) => {
    memberSpend[t.member] = (memberSpend[t.member] || 0) + t.amount;
  });

  const lastSyncStr = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Только что";

  const handleCopyInviteCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inputFamilyCode || familyCode || "SAFE-77");
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyDockerCommand = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText("docker compose up -d");
      setCopiedDocker(true);
      setTimeout(() => setCopiedDocker(false), 2000);
    }
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    onAddMember(newMemberName.trim(), newMemberRole, newMemberAvatar);
    setNewMemberName("");
    setIsAddingMember(false);
  };

  // Run ping test
  const handleTestPing = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await testServerConnection(inputServerUrl, inputFamilyCode);
      setPingResult({
        tested: true,
        ok: res.ok,
        pingMs: res.pingMs,
        error: res.error,
        serverApp: res.details?.app,
      });
    } catch (err: any) {
      setPingResult({
        tested: true,
        ok: false,
        pingMs: 0,
        error: err.message || "Ошибка подключения",
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  // Save server settings
  const handleSaveServerConfig = () => {
    onUpdateServerConfig({
      serverUrl: inputServerUrl.trim(),
      familyCode: inputFamilyCode.trim() || "SAFE-77",
      syncMode,
    });
    if (onManualSync) {
      onManualSync();
    }
  };

  return (
    <div className="w-full p-4 space-y-4 animate-in fade-in pb-20">
      {/* Page Title Header */}
      <div className="pb-2 border-b border-white/10 flex justify-between items-end">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Семья и Сервер</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Режимы работы, Self-Hosted VDS, члены семьи и пинг
          </p>
        </div>
      </div>

      {/* Mode Switcher: Local Only vs Self-Hosted VDS */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg space-y-3">
        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
          Архитектурный режим приложения
        </label>

        <div className="grid grid-cols-2 gap-2">
          {/* Option 1: Local Only */}
          <button
            type="button"
            onClick={() => {
              onUpdateServerConfig({ syncMode: "local_only" });
            }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              syncMode === "local_only"
                ? "bg-amber-500/10 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                : "bg-slate-950/60 border-white/5 hover:border-white/20 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <HardDrive className={`w-3.5 h-3.5 ${syncMode === "local_only" ? "text-amber-400" : "text-slate-500"}`} />
                <span>Автономный</span>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  syncMode === "local_only" ? "border-amber-400 bg-amber-400/20" : "border-slate-600"
                }`}
              >
                {syncMode === "local_only" && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              100% в памяти телефона. Без отправки данных в сеть.
            </p>
          </button>

          {/* Option 2: Self-Hosted VDS */}
          <button
            type="button"
            onClick={() => {
              onUpdateServerConfig({ syncMode: "self_hosted" });
            }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              syncMode === "self_hosted"
                ? "bg-sky-500/10 border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                : "bg-slate-950/60 border-white/5 hover:border-white/20 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <Server className={`w-3.5 h-3.5 ${syncMode === "self_hosted" ? "text-sky-400" : "text-slate-500"}`} />
                <span>Self-Hosted VDS</span>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  syncMode === "self_hosted" ? "border-sky-400 bg-sky-400/20" : "border-slate-600"
                }`}
              >
                {syncMode === "self_hosted" && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Синхронизация между устройствами семьи на вашем сервере.
            </p>
          </button>
        </div>
      </div>

      {/* Custom Server URL & Connection Configurator (Active when self_hosted) */}
      {syncMode === "self_hosted" && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 border border-sky-500/30 backdrop-blur-md space-y-3.5 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-sky-300 tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Конфигуратор VDS Сервера</span>
            </h3>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${
                networkStatus === "syncing"
                  ? "text-sky-300 bg-sky-500/10 border-sky-500/30"
                  : networkStatus === "offline"
                  ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  networkStatus === "offline"
                    ? "bg-amber-400"
                    : networkStatus === "syncing"
                    ? "bg-sky-400 animate-pulse"
                    : "bg-emerald-400"
                }`}
              />
              <span>
                {networkStatus === "offline"
                  ? "Offline"
                  : networkStatus === "syncing"
                  ? "Синхронизация"
                  : "Online"}
              </span>
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1 flex justify-between">
                <span>Адрес вашего VDS / Домен:</span>
                <span className="text-slate-500 font-normal">Оставьте пустым для встроенного API</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputServerUrl}
                  onChange={(e) => setInputServerUrl(e.target.value)}
                  placeholder="https://budget.myvds.ru или http://185.xx.xx.xx:3000"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTestingPing}
                  className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingPing ? "animate-spin" : ""}`} />
                  <span>{isTestingPing ? "Тест..." : "Пинг"}</span>
                </button>
              </div>
            </div>

            {/* Ping Result Banner */}
            {pingResult && pingResult.tested && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
                  pingResult.ok
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{pingResult.ok ? "🟢" : "🔴"}</span>
                  <div>
                    <div className="font-bold">
                      {pingResult.ok
                        ? `Связь с сервером установлена! (${pingResult.serverApp || "SafeDay"})`
                        : "Ошибка соединения с VDS"}
                    </div>
                    <div className="text-[10px] opacity-80">
                      {pingResult.ok ? `Задержка ответа: ${pingResult.pingMs} ms` : pingResult.error}
                    </div>
                  </div>
                </div>
                {pingResult.ok && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 font-bold">
                    {pingResult.pingMs}ms
                  </span>
                )}
              </div>
            )}

            {/* Save Server Config Button */}
            <button
              type="button"
              onClick={handleSaveServerConfig}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить настройки сервера и синхронизировать</span>
            </button>
          </div>

          {/* Sync frequency selector */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Частота автосинхронизации:
              </span>
              <span className="text-sky-300 font-mono text-[11px]">
                {syncIntervalSeconds === 0
                  ? "Только вручную"
                  : `Каждые ${syncIntervalSeconds} сек`}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "10 сек", val: 10 },
                { label: "20 сек", val: 20 },
                { label: "60 сек", val: 60 },
                { label: "Вручную", val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onUpdateSyncInterval(opt.val)}
                  className={`py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                    syncIntervalSeconds === opt.val
                      ? "bg-sky-500/20 text-sky-200 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                      : "bg-slate-950/60 text-slate-400 border-white/5 hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sync status metrics */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-400">
              <span>Очередь неотправленных чеков:</span>
              <strong className={pendingQueueCount > 0 ? "text-amber-400" : "text-emerald-400"}>
                {pendingQueueCount > 0 ? `${pendingQueueCount} в очереди` : "0 (Все сохранено на VDS)"}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Последняя синхронизация:</span>
              <strong className="text-slate-200 font-mono">{lastSyncStr}</strong>
            </div>
          </div>

          {onManualSync && (
            <button
              onClick={onManualSync}
              disabled={networkStatus === "syncing"}
              className="w-full py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${networkStatus === "syncing" ? "animate-spin" : ""}`} />
              <span>{networkStatus === "syncing" ? "Синхронизация..." : "Синхронизировать сейчас"}</span>
            </button>
          )}

          {/* Self-Hosted Deployment Guide Accordion */}
          <div className="border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={() => setShowDockerGuide(!showDockerGuide)}
              className="w-full flex items-center justify-between text-slate-300 text-xs font-bold p-1 hover:text-sky-300 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Инструкция запуска сервера на VDS (Docker)</span>
              </span>
              {showDockerGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDockerGuide && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-sky-500/20 space-y-2.5 text-xs text-slate-300 animate-in fade-in font-sans">
                <p className="text-[11px] text-slate-400">
                  В корень репозитория уже добавлены <span className="text-sky-300 font-mono">Dockerfile</span> и{" "}
                  <span className="text-sky-300 font-mono">docker-compose.yml</span>. Чтобы поднять свой backend на любом VDS:
                </p>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10 font-mono text-[11px] text-emerald-400 space-y-1 relative">
                  <div>git clone &lt;ваш-репозиторий&gt;</div>
                  <div>cd safeday</div>
                  <div className="text-sky-300 font-bold">docker compose up -d</div>
                  <button
                    onClick={handleCopyDockerCommand}
                    className="absolute right-2 top-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition"
                  >
                    {copiedDocker ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDocker ? "Скопировано" : "Копировать"}</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400">
                  После запуска введите IP или домен сервера в поле выше и нажмите <strong>«Пинг»</strong>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Family Invite Code & Auth Mechanism Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/70 to-slate-900/60 border border-indigo-500/20 backdrop-blur-md space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-indigo-200 tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Семейный код и Авторизация</span>
          </h3>
          <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold">
            Общая семья
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Чтобы подключить телефон супруга или ребенка к общему серверу, откройте SafeDay на их смартфоне и введите код:
        </p>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/30">
          <div className="flex-1 text-center font-mono font-black text-lg text-emerald-400 tracking-widest">
            {familyCode || "SAFE-77"}
          </div>
          <button
            onClick={handleCopyInviteCode}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Скопирован</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Код</span>
              </>
            )}
          </button>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Все запросы к VDS шифруются и валидируются данным семейным токеном.</span>
        </div>
      </div>

      {/* Family Members Management & Today Spend Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
            Члены семьи ({familyMembers.length})
          </h3>
          <button
            onClick={() => setIsAddingMember(true)}
            className="text-[10px] text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <UserPlus className="w-3 h-3" />
            <span>Добавить</span>
          </button>
        </div>

        {/* Add Member Form Modal / Inline Box */}
        {isAddingMember && (
          <form
            onSubmit={handleCreateMember}
            className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-3 animate-in fade-in"
          >
            <div className="text-xs font-bold text-amber-300">Новый профиль в семье</div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Имя члена семьи:</label>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Например, София"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Выберите аватар:</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setNewMemberAvatar(av)}
                    className={`text-lg p-1.5 rounded-lg border transition cursor-pointer ${
                      newMemberAvatar === av
                        ? "bg-amber-500/20 border-amber-400 scale-110"
                        : "bg-slate-900 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Роль:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewMemberRole("member")}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    newMemberRole === "member"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                      : "bg-slate-900 text-slate-400 border-white/10"
                  }`}
                >
                  Участник
                </button>
                <button
                  type="button"
                  onClick={() => setNewMemberRole("admin")}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    newMemberRole === "admin"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                      : "bg-slate-900 text-slate-400 border-white/10"
                  }`}
                >
                  Администратор
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition cursor-pointer"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setIsAddingMember(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-white transition cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {/* Members Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col justify-between relative group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl p-1.5 rounded-xl bg-slate-800/80">{member.avatar}</span>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">{member.name}</div>
                    <div className="text-[9px] text-slate-400">
                      {member.role === "admin" ? "Администратор" : "Участник"}
                    </div>
                  </div>
                </div>

                {familyMembers.length > 1 && (
                  <button
                    onClick={() => onDeleteMember(member.id)}
                    className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Удалить профиль"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-white/5 flex justify-between items-end">
                <div>
                  <div className="text-[9px] text-slate-400">Сегодня:</div>
                  <div className="text-xs font-extrabold text-emerald-400 font-mono">
                    {formatRubles(memberSpend[member.name] || 0)}
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  {todayTx.filter((t) => t.member === member.name).length} чеков
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Android Push Notifications Settings */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>Уведомления о лимитах</span>
          </h3>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
            Включены
          </span>
        </div>

        <div className="space-y-2">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
            <div>
              <div className="font-semibold text-slate-200">Предупреждение при 80% лимита</div>
              <div className="text-[10px] text-slate-400">Сигнал при приближении к порогу дня</div>
            </div>
            <button
              onClick={() => setNotify80Percent(!notify80Percent)}
              className={`w-10 h-6 rounded-full transition p-1 cursor-pointer ${
                notify80Percent ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  notify80Percent ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
            <div>
              <div className="font-semibold text-slate-200">Вечерний отчет SafeDay (21:00)</div>
              <div className="text-[10px] text-slate-400">Сумма сохраненных средств за день</div>
            </div>
            <button
              onClick={() => setDailyRecapNotif(!dailyRecapNotif)}
              className={`w-10 h-6 rounded-full transition p-1 cursor-pointer ${
                dailyRecapNotif ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  dailyRecapNotif ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Trigger Test Push Button */}
        <button
          onClick={onTriggerPushNotif}
          className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>Тестовое Push-уведомление</span>
        </button>
      </div>

      {/* Backup & Data Export Card */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-purple-400" />
            <span>Резервные копии и Экспорт данных</span>
          </h3>
          <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-mono">
            JSON / CSV
          </span>
        </div>

        {/* Notification Toast inside settings */}
        {backupToast && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{backupToast}</span>
          </div>
        )}

        {backupError && (
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{backupError}</span>
          </div>
        )}

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Сохраняйте полные копии бюджета для переноса на другой телефон/компьютер или выгружайте траты в Excel:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Download JSON backup */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Скачать JSON бэкап</span>
          </button>

          {/* Upload and restore JSON backup */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Восстановить из файла</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          {/* Export to CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Таблица Excel (CSV)</span>
          </button>
        </div>

        {/* Download Project Source Code ZIP */}
        <div className="pt-2 border-t border-white/5">
          <a
            href="/api/download-zip"
            download="safeday-project.zip"
            className="w-full p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Скачать полный исходный код (.ZIP) для VDS</span>
          </a>
        </div>
      </div>

      {/* Reset Demo Data Button */}
      <div className="pt-2">
        <button
          onClick={onResetData}
          className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Сбросить данные к начальным</span>
        </button>
      </div>
    </div>
  );
};


