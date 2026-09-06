import { Transaction, CategoryType } from "../types";
import { FamilyAppData } from "../services/syncService";

/**
 * Exports transactions to CSV format with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  fileName = `safeday_transactions_${new Date().toISOString().split("T")[0]}.csv`
) {
  const headers = [
    "ID",
    "Дата",
    "Время",
    "Название",
    "Категория",
    "Сумма (₽)",
    "Член семьи",
    "Источник ввода",
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map((t) => [
    escapeCSV(t.id),
    escapeCSV(t.date),
    escapeCSV(t.time),
    escapeCSV(t.name),
    escapeCSV(t.category),
    escapeCSV(t.amount),
    escapeCSV(t.member),
    escapeCSV(t.source || "manual"),
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(";"),
    ...rows.map((r) => r.join(";")),
  ].join("\r\n");

  // UTF-8 BOM (\uFEFF) ensures Excel properly displays Cyrillic characters
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports full family budget state as a JSON backup file
 */
export function exportDatabaseToJSON(
  data: FamilyAppData,
  fileName = `safeday_backup_${new Date().toISOString().split("T")[0]}.json`
) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses uploaded JSON backup file
 */
export function parseAndValidateBackup(jsonString: string): {
  valid: boolean;
  data?: FamilyAppData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== "object") {
      return { valid: false, error: "Файл не содержит корректного JSON-объекта" };
    }

    if (!parsed.budgetConfig || !Array.isArray(parsed.transactions)) {
      return {
        valid: false,
        error: "Структура бэкапа не соответствует формату SafeDay (нет budgetConfig или transactions)",
      };
    }

    return {
      valid: true,
      data: {
        budgetConfig: parsed.budgetConfig,
        mandatoryPayments: Array.isArray(parsed.mandatoryPayments) ? parsed.mandatoryPayments : [],
        familyGoals: Array.isArray(parsed.familyGoals) ? parsed.familyGoals : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        familyMembers: Array.isArray(parsed.familyMembers) ? parsed.familyMembers : [],
        lastUpdated: Date.now(),
      },
    };
  } catch (err: any) {
    return { valid: false, error: "Не удалось распарсить JSON: " + err.message };
  }
}
