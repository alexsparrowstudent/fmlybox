import { BudgetConfig, MandatoryPayment, FamilyGoal, Transaction, FamilyMember } from "../types";
import {
  initialBudgetConfig,
  initialMandatoryPayments,
  initialFamilyGoals,
  initialTransactions,
  initialFamilyMembers,
} from "../data/mockData";

export interface SyncQueueItem {
  id: string;
  type:
    | "ADD_TRANSACTION"
    | "UPDATE_TRANSACTION"
    | "DELETE_TRANSACTION"
    | "UPDATE_CONFIG"
    | "TOGGLE_MANDATORY"
    | "ADD_MANDATORY"
    | "DELETE_MANDATORY"
    | "DEPOSIT_GOAL"
    | "ADD_MEMBER"
    | "DELETE_MEMBER"
    | "RESET_DATA"
    | "RESTORE_BACKUP";
  payload: any;
  timestamp: number;
}

export interface FamilyAppData {
  budgetConfig: BudgetConfig;
  mandatoryPayments: MandatoryPayment[];
  familyGoals: FamilyGoal[];
  transactions: Transaction[];
  familyMembers: FamilyMember[];
  lastUpdated: number;
}

export type NetworkStatus = "online" | "syncing" | "offline" | "error";

const STORAGE_KEYS = {
  CONFIG: "safeday_config",
  MANDATORY: "safeday_mandatory",
  GOALS: "safeday_goals",
  TRANSACTIONS: "safeday_transactions",
  MEMBERS: "safeday_members",
  SYNC_QUEUE: "safeday_sync_queue",
  LAST_SYNC: "safeday_last_sync_time",
};

// Helper: load local snapshot
export function getLocalData(): FamilyAppData {
  try {
    const configRaw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const mandatoryRaw = localStorage.getItem(STORAGE_KEYS.MANDATORY);
    const goalsRaw = localStorage.getItem(STORAGE_KEYS.GOALS);
    const txRaw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const membersRaw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    const lastSyncRaw = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);

    return {
      budgetConfig: configRaw ? JSON.parse(configRaw) : initialBudgetConfig,
      mandatoryPayments: mandatoryRaw ? JSON.parse(mandatoryRaw) : initialMandatoryPayments,
      familyGoals: goalsRaw ? JSON.parse(goalsRaw) : initialFamilyGoals,
      transactions: txRaw ? JSON.parse(txRaw) : initialTransactions,
      familyMembers: membersRaw ? JSON.parse(membersRaw) : initialFamilyMembers,
      lastUpdated: lastSyncRaw ? Number(lastSyncRaw) : Date.now(),
    };
  } catch (e) {
    console.error("Failed to read local cache, using defaults:", e);
    return {
      budgetConfig: initialBudgetConfig,
      mandatoryPayments: initialMandatoryPayments,
      familyGoals: initialFamilyGoals,
      transactions: initialTransactions,
      familyMembers: initialFamilyMembers,
      lastUpdated: Date.now(),
    };
  }
}

// Helper: save local snapshot
export function saveLocalData(data: Partial<FamilyAppData>) {
  try {
    if (data.budgetConfig) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.budgetConfig));
    }
    if (data.mandatoryPayments) {
      localStorage.setItem(STORAGE_KEYS.MANDATORY, JSON.stringify(data.mandatoryPayments));
    }
    if (data.familyGoals) {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data.familyGoals));
    }
    if (data.transactions) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
    }
    if (data.familyMembers) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data.familyMembers));
    }
    if (data.lastUpdated) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(data.lastUpdated));
    }
  } catch (e) {
    console.error("Failed to write to localStorage:", e);
  }
}

// Sync queue management
export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToSyncQueue(item: Omit<SyncQueueItem, "id" | "timestamp">) {
  const queue = getSyncQueue();
  const newItem: SyncQueueItem = {
    ...item,
    id: "q_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now(),
  };
  queue.push(newItem);
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  return queue;
}

export function clearSyncQueue() {
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
}

// Helper to resolve base URL
export function getBaseApiUrl(customUrl?: string): string {
  if (!customUrl || customUrl.trim() === "") {
    return "";
  }
  let cleaned = customUrl.trim();
  if (cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

// Server Ping Test
export async function testServerConnection(
  serverUrl?: string,
  familyCode?: string
): Promise<{ ok: boolean; pingMs: number; error?: string; details?: any }> {
  const base = getBaseApiUrl(serverUrl);
  const targetUrl = `${base}/api/health`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {};
    if (familyCode) {
      headers["x-family-code"] = familyCode;
    }

    const res = await fetch(targetUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const pingMs = Date.now() - startTime;

    if (!res.ok) {
      return {
        ok: false,
        pingMs,
        error: `Сервер вернул статус HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      pingMs,
      details: data,
    };
  } catch (err: any) {
    const pingMs = Date.now() - startTime;
    const isTimeout = err.name === "AbortError";
    return {
      ok: false,
      pingMs,
      error: isTimeout
        ? "Превышено время ожидания ответа (таймаут 6 сек)"
        : err.message || "Не удалось соединиться с хостом",
    };
  }
}

// Server Sync Action
export async function performServerSync(
  currentLocalData: FamilyAppData
): Promise<{ success: boolean; data?: FamilyAppData; queueLength: number }> {
  // If user chose local only mode, do not contact server
  if (currentLocalData.budgetConfig?.syncMode === "local_only") {
    return { success: true, queueLength: 0 };
  }

  const queue = getSyncQueue();

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { success: false, queueLength: queue.length };
  }

  const base = getBaseApiUrl(currentLocalData.budgetConfig?.serverUrl);
  const targetUrl = `${base}/api/sync`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (currentLocalData.budgetConfig?.familyCode) {
      headers["x-family-code"] = currentLocalData.budgetConfig.familyCode;
    }

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        queue,
        lastUpdated: currentLocalData.lastUpdated,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    const serverData: FamilyAppData = await res.json();

    // Clear processed queue on success
    clearSyncQueue();

    // Update local snapshot with server truth
    saveLocalData({
      budgetConfig: {
        ...serverData.budgetConfig,
        // preserve local settings if server didn't provide
        serverUrl: currentLocalData.budgetConfig.serverUrl,
        syncMode: currentLocalData.budgetConfig.syncMode,
      },
      mandatoryPayments: serverData.mandatoryPayments,
      familyGoals: serverData.familyGoals,
      transactions: serverData.transactions,
      familyMembers: serverData.familyMembers,
      lastUpdated: serverData.lastUpdated || Date.now(),
    });

    return {
      success: true,
      data: serverData,
      queueLength: 0,
    };
  } catch (err) {
    console.warn("Offline or sync failed, staying local:", err);
    return {
      success: false,
      queueLength: queue.length,
    };
  }
}
