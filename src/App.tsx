import React, { useState, useEffect, useCallback } from "react";
import { AndroidFrame } from "./components/AndroidFrame";
import { TopNav } from "./components/TopNav";
import { FinancialSpeedometer } from "./components/FinancialSpeedometer";
import { QuickActionBar } from "./components/QuickActionBar";
import { FamilyGoalWidget } from "./components/FamilyGoalWidget";
import { TransactionList } from "./components/TransactionList";
import { BudgetScreen } from "./components/BudgetScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { FamilySettingsScreen } from "./components/FamilySettingsScreen";
import { VoiceModal } from "./components/VoiceModal";
import { QuickTextModal } from "./components/QuickTextModal";
import { ScanReceiptModal } from "./components/ScanReceiptModal";
import { EditTransactionModal } from "./components/EditTransactionModal";
import { PushNotificationToast } from "./components/PushNotificationToast";

import {
  Transaction,
  MandatoryPayment,
  FamilyGoal,
  BudgetConfig,
  ParsedExpense,
  FamilyMember,
} from "./types";
import {
  initialBudgetConfig,
  initialMandatoryPayments,
  initialFamilyGoals,
  initialTransactions,
  initialFamilyMembers,
} from "./data/mockData";
import { calculateSafeToSpend } from "./utils/financial";
import {
  getLocalData,
  saveLocalData,
  addToSyncQueue,
  performServerSync,
  getSyncQueue,
  NetworkStatus,
  FamilyAppData,
} from "./services/syncService";

export default function App() {
  // Local snapshot initialization
  const initialLocal = getLocalData();

  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(initialLocal.budgetConfig);
  const [mandatoryPayments, setMandatoryPayments] = useState<MandatoryPayment[]>(initialLocal.mandatoryPayments);
  const [familyGoals, setFamilyGoals] = useState<FamilyGoal[]>(initialLocal.familyGoals);
  const [transactions, setTransactions] = useState<Transaction[]>(initialLocal.transactions);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    initialLocal.familyMembers || initialFamilyMembers
  );
  
  // Sync and network status
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() =>
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online"
  );
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => getSyncQueue().length);
  const [lastSyncTime, setLastSyncTime] = useState<number>(initialLocal.lastUpdated || Date.now());

  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pushNotifMessage, setPushNotifMessage] = useState<string | null>(null);

  // Sync to local cache on state change
  useEffect(() => {
    saveLocalData({
      budgetConfig,
      mandatoryPayments,
      familyGoals,
      transactions,
      familyMembers,
      lastUpdated: lastSyncTime,
    });
  }, [budgetConfig, mandatoryPayments, familyGoals, transactions, familyMembers, lastSyncTime]);

  // Core Sync Routine
  const triggerSync = useCallback(async (forcedLocalSnapshot?: FamilyAppData) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNetworkStatus("offline");
      setPendingQueueCount(getSyncQueue().length);
      return;
    }

    setNetworkStatus("syncing");

    const currentSnapshot: FamilyAppData = forcedLocalSnapshot || {
      budgetConfig,
      mandatoryPayments,
      familyGoals,
      transactions,
      familyMembers,
      lastUpdated: lastSyncTime,
    };

    const res = await performServerSync(currentSnapshot);

    if (res.success && res.data) {
      setBudgetConfig(res.data.budgetConfig);
      setMandatoryPayments(res.data.mandatoryPayments);
      setFamilyGoals(res.data.familyGoals);
      setTransactions(res.data.transactions);
      if (res.data.familyMembers) {
        setFamilyMembers(res.data.familyMembers);
      }
      setLastSyncTime(res.data.lastUpdated || Date.now());
      setNetworkStatus("online");
      setPendingQueueCount(0);
    } else {
      setPendingQueueCount(res.queueLength);
      setNetworkStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online");
    }
  }, [budgetConfig, mandatoryPayments, familyGoals, transactions, familyMembers, lastSyncTime]);

  // Initial mount sync + background periodic sync
  useEffect(() => {
    // 1. Mount sync
    triggerSync();

    // 2. Network status listeners
    const handleOnline = () => {
      setNetworkStatus("syncing");
      triggerSync();
    };

    const handleOffline = () => {
      setNetworkStatus("offline");
      setPendingQueueCount(getSyncQueue().length);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 3. Periodic background sync according to budgetConfig.syncIntervalSeconds
    const intervalSec = budgetConfig.syncIntervalSeconds !== undefined ? budgetConfig.syncIntervalSeconds : 20;
    let interval: any = null;
    if (intervalSec > 0) {
      interval = setInterval(() => {
        if (navigator.onLine) {
          triggerSync();
        }
      }, intervalSec * 1000);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (interval) clearInterval(interval);
    };
  }, [triggerSync, budgetConfig.syncIntervalSeconds]);

  // Safe-to-Spend Live Calculation
  const safeStats = calculateSafeToSpend(
    budgetConfig.monthlyIncome,
    mandatoryPayments,
    budgetConfig.savingsGoalMonthly,
    transactions,
    budgetConfig.daysToSalary
  );

  const mandatoryPaidPercent =
    safeStats.mandatoryTotal > 0
      ? Math.round((safeStats.mandatoryPaidTotal / safeStats.mandatoryTotal) * 100)
      : 100;

  // Add new expense (Optimistic UI + Offline Queue)
  const handleAddExpense = (parsed: ParsedExpense) => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newTx: Transaction = {
      id: "t_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
      name: parsed.name,
      amount: parsed.amount,
      category: parsed.category,
      date: todayStr,
      time: timeStr,
      member: parsed.member || budgetConfig.activeMemberFilter || "Алексей",
      source: (parsed as any).source || "text",
    };

    // 1. Immediate local update
    const updatedTxList = [newTx, ...transactions];
    setTransactions(updatedTxList);

    // 2. Queue for server sync
    addToSyncQueue({
      type: "ADD_TRANSACTION",
      payload: newTx,
    });
    setPendingQueueCount(getSyncQueue().length);

    // 3. Background server push
    triggerSync();

    // Show push notification confirmation
    setPushNotifMessage(
      `💸 Добавлен расход: ${parsed.name} (${parsed.amount} ₽). Новый дневной остаток: ${
        safeStats.safeDailyLimit - (safeStats.todaySpent + parsed.amount)
      } ₽`
    );
  };

  // Update transaction (Edit)
  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    addToSyncQueue({
      type: "UPDATE_TRANSACTION",
      payload: updated,
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
    setPushNotifMessage(`✏️ Чек «${updated.name}» успешно изменен (${updated.amount} ₽)`);
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    addToSyncQueue({
      type: "DELETE_TRANSACTION",
      payload: { id },
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
  };

  // Restore whole database backup from JSON file
  const handleRestoreBackup = (backup: FamilyAppData) => {
    if (backup.budgetConfig) setBudgetConfig(backup.budgetConfig);
    if (Array.isArray(backup.mandatoryPayments)) setMandatoryPayments(backup.mandatoryPayments);
    if (Array.isArray(backup.familyGoals)) setFamilyGoals(backup.familyGoals);
    if (Array.isArray(backup.transactions)) setTransactions(backup.transactions);
    if (Array.isArray(backup.familyMembers)) setFamilyMembers(backup.familyMembers);

    addToSyncQueue({
      type: "RESTORE_BACKUP",
      payload: backup,
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync(backup);
    setPushNotifMessage(`💾 Резервная копия успешно восстановлена! (${backup.transactions.length} операций)`);
  };

  // Budget Config Update
  const handleUpdateConfig = (updated: Partial<BudgetConfig>) => {
    const nextConfig = { ...budgetConfig, ...updated };
    setBudgetConfig(nextConfig);
    addToSyncQueue({
      type: "UPDATE_CONFIG",
      payload: nextConfig,
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
  };

  // Family Members Management Actions
  const handleAddMember = (name: string, role: "admin" | "member", avatar: string) => {
    const newMember: FamilyMember = {
      id: "mem_" + Date.now(),
      name,
      avatar,
      role,
      joinedAt: new Date().toISOString().split("T")[0],
    };
    const updatedList = [...familyMembers, newMember];
    setFamilyMembers(updatedList);
    addToSyncQueue({
      type: "ADD_MEMBER",
      payload: newMember,
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
    setPushNotifMessage(`👨‍👩‍👧 Добавлен новый член семьи: ${name}`);
  };

  const handleDeleteMember = (id: string) => {
    const updatedList = familyMembers.filter((m) => m.id !== id);
    setFamilyMembers(updatedList);
    addToSyncQueue({
      type: "DELETE_MEMBER",
      payload: { id },
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
  };

  // Mandatory Payment Actions
  const handleToggleMandatoryPaid = (id: string) => {
    setMandatoryPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPaid: !p.isPaid } : p))
    );
    addToSyncQueue({
      type: "TOGGLE_MANDATORY",
      payload: { id },
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
  };

  const handleAddMandatory = (
    payment: Omit<MandatoryPayment, "id" | "isPaid">
  ) => {
    const newPayment: MandatoryPayment = {
      ...payment,
      id: "m_" + Date.now(),
      isPaid: false,
    };
    setMandatoryPayments((prev) => [...prev, newPayment]);
    addToSyncQueue({
      type: "ADD_MANDATORY",
      payload: newPayment,
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
  };

  const handleDeleteMandatory = (id: string) => {
    setMandatoryPayments((prev) => prev.filter((p) => p.id !== id));
    addToSyncQueue({
      type: "DELETE_MANDATORY",
      payload: { id },
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
  };

  // Family Goal Deposit
  const handleAddDeposit = (goalId: string, amount: number) => {
    setFamilyGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      )
    );
    addToSyncQueue({
      type: "DEPOSIT_GOAL",
      payload: { goalId, amount },
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
    setPushNotifMessage(`🎯 Пополнена цель! +${amount} ₽ внесено в копилку.`);
  };

  // Trigger test push notification
  const handleTriggerPushNotif = () => {
    const messages = [
      `🟢 На сегодня безопасно потратить: ${safeStats.safeDailyLimit} ₽. Семья укладывается в норму!`,
      `⚠️ Внимание: Вы потратили ${safeStats.todaySpent} ₽ из дневного лимита ${safeStats.safeDailyLimit} ₽.`,
      `🎉 Все обязательные платежи этого месяца закрыты на ${mandatoryPaidPercent}%!`,
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setPushNotifMessage(randomMsg);
  };

  // Reset to initial mock data
  const handleResetData = () => {
    setBudgetConfig(initialBudgetConfig);
    setMandatoryPayments(initialMandatoryPayments);
    setFamilyGoals(initialFamilyGoals);
    setTransactions(initialTransactions);
    setFamilyMembers(initialFamilyMembers);
    addToSyncQueue({
      type: "RESET_DATA",
      payload: {},
    });
    setPendingQueueCount(getSyncQueue().length);
    triggerSync();
    setPushNotifMessage("🔄 Данные приложений сброшены к исходным демо-значениям!");
  };

  const todayCount = transactions.filter(
    (t) => t.date === new Date().toISOString().split("T")[0]
  ).length;

  return (
    <AndroidFrame
      activeTab={activeTab}
      onTabChange={setActiveTab}
      todayCount={todayCount}
    >
      {/* Top Navigation with Live Sync Indicator */}
      <TopNav
        activeMember={budgetConfig.activeMemberFilter}
        onMemberChange={(m) => handleUpdateConfig({ activeMemberFilter: m })}
        onTriggerPushNotif={handleTriggerPushNotif}
        networkStatus={networkStatus}
        pendingQueueCount={pendingQueueCount}
        onManualSync={() => triggerSync()}
        familyMembers={familyMembers}
      />

      {/* Push Toast Alert */}
      {pushNotifMessage && (
        <PushNotificationToast
          message={pushNotifMessage}
          onClose={() => setPushNotifMessage(null)}
        />
      )}

      {/* Active Tab View Rendering */}
      <div className="pb-12">
        {activeTab === "dashboard" && (
          <div className="p-4 space-y-2 animate-in fade-in">
            {/* Speedometer Hero Card */}
            <FinancialSpeedometer
              safeDailyLimit={safeStats.safeDailyLimit}
              todaySpent={safeStats.todaySpent}
              daysToSalary={budgetConfig.daysToSalary}
              mandatoryPaidPercent={mandatoryPaidPercent}
              safeZoneStatus={safeStats.safeZoneStatus}
              onQuickAdd={() => setIsTextModalOpen(true)}
            />

            {/* Quick Action Bar (Voice, Text, Receipt) */}
            <QuickActionBar
              onOpenVoice={() => setIsVoiceModalOpen(true)}
              onOpenText={() => setIsTextModalOpen(true)}
              onOpenScan={() => setIsScanModalOpen(true)}
            />

            {/* Family Savings Goal Widget */}
            <FamilyGoalWidget
              goals={familyGoals}
              onAddDeposit={handleAddDeposit}
            />

            {/* Transactions Feed */}
            <TransactionList
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
              activeMemberFilter={budgetConfig.activeMemberFilter}
            />
          </div>
        )}

        {activeTab === "budget" && (
          <BudgetScreen
            config={budgetConfig}
            mandatoryPayments={mandatoryPayments}
            onUpdateConfig={handleUpdateConfig}
            onToggleMandatoryPaid={handleToggleMandatoryPaid}
            onAddMandatory={handleAddMandatory}
            onDeleteMandatory={handleDeleteMandatory}
            safeDailyLimit={safeStats.safeDailyLimit}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsScreen
            transactions={transactions}
            familyMembers={familyMembers}
            income={budgetConfig.monthlyIncome}
            mandatoryTotal={safeStats.mandatoryTotal}
            safeLimit={safeStats.safeDailyLimit}
            todaySpent={safeStats.todaySpent}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            fullAppData={{
              budgetConfig,
              mandatoryPayments,
              familyGoals,
              transactions,
              familyMembers,
              lastUpdated: lastSyncTime,
            }}
          />
        )}

        {activeTab === "family" && (
          <FamilySettingsScreen
            transactions={transactions}
            familyMembers={familyMembers}
            syncIntervalSeconds={budgetConfig.syncIntervalSeconds !== undefined ? budgetConfig.syncIntervalSeconds : 20}
            familyCode={budgetConfig.familyCode || "SAFE-77"}
            serverUrl={budgetConfig.serverUrl || ""}
            syncMode={budgetConfig.syncMode || "self_hosted"}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
            onUpdateSyncInterval={(sec) => handleUpdateConfig({ syncIntervalSeconds: sec })}
            onUpdateServerConfig={(config) => handleUpdateConfig(config)}
            onTriggerPushNotif={handleTriggerPushNotif}
            onResetData={handleResetData}
            networkStatus={networkStatus}
            pendingQueueCount={pendingQueueCount}
            lastSyncTime={lastSyncTime}
            onManualSync={() => triggerSync()}
            fullAppData={{
              budgetConfig,
              mandatoryPayments,
              familyGoals,
              transactions,
              familyMembers,
              lastUpdated: lastSyncTime,
            }}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </div>

      {/* Modals */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAddExpense={(parsed) => handleAddExpense({ ...parsed, source: "voice" } as any)}
        activeMember={budgetConfig.activeMemberFilter}
      />

      <QuickTextModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onAddExpense={(parsed) => handleAddExpense({ ...parsed, source: "text" } as any)}
        activeMember={budgetConfig.activeMemberFilter}
      />

      <ScanReceiptModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddExpense={(parsed) => handleAddExpense({ ...parsed, source: "receipt" } as any)}
        activeMember={budgetConfig.activeMemberFilter}
      />

      {/* Global Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        familyMembers={familyMembers}
        onClose={() => setEditingTransaction(null)}
        onSave={(updated) => {
          handleUpdateTransaction(updated);
          setEditingTransaction(null);
        }}
        onDelete={(id) => {
          handleDeleteTransaction(id);
          setEditingTransaction(null);
        }}
      />
    </AndroidFrame>
  );
}

