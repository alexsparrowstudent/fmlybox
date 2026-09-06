import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// --- Persistent Database Store Manager ---
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "safeday-db.json");

interface DatabaseSchema {
  budgetConfig: {
    monthlyIncome: number;
    savingsGoalMonthly: number;
    daysToSalary: number;
    salaryDate: string;
    activeMemberFilter: string;
    syncIntervalSeconds?: number;
    familyCode?: string;
  };
  mandatoryPayments: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: number;
    isPaid: boolean;
    category: string;
  }>;
  familyGoals: Array<{
    id: string;
    title: string;
    emoji: string;
    currentAmount: number;
    targetAmount: number;
    monthlyContribution: number;
  }>;
  familyMembers: Array<{
    id: string;
    name: string;
    avatar: string;
    role: "admin" | "member";
    joinedAt: string;
  }>;
  transactions: Array<{
    id: string;
    name: string;
    amount: number;
    category: string;
    date: string;
    time: string;
    member: string;
    source?: string;
    receiptItems?: Array<{ name: string; price: number }>;
  }>;
  lastUpdated: number;
}

const todayStr = new Date().toISOString().split("T")[0];
const yesterdayDate = new Date(Date.now() - 86400000);
const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

const defaultDatabase: DatabaseSchema = {
  budgetConfig: {
    monthlyIncome: 135000,
    savingsGoalMonthly: 15000,
    daysToSalary: 12,
    salaryDate: "2026-08-06",
    activeMemberFilter: "Вся семья",
    syncIntervalSeconds: 20,
    familyCode: "SAFE-77",
  },
  mandatoryPayments: [
    { id: "m1", name: "Ипотека / Аренда", amount: 35000, dueDate: 10, isPaid: true, category: "Дом и ЖКХ" },
    { id: "m2", name: "ЖКХ и Электричество", amount: 7200, dueDate: 15, isPaid: true, category: "Дом и ЖКХ" },
    { id: "m3", name: "Детский сад и Секции", amount: 8500, dueDate: 5, isPaid: true, category: "Дети" },
    { id: "m4", name: "Мобильная связь и Интернет", amount: 1800, dueDate: 20, isPaid: false, category: "Дом и ЖКХ" },
    { id: "m5", name: "Кредит на авто", amount: 12000, dueDate: 25, isPaid: false, category: "Транспорт" },
  ],
  familyGoals: [
    { id: "g1", title: "Поездка на море", emoji: "🏖️", currentAmount: 145000, targetAmount: 200000, monthlyContribution: 10000 },
    { id: "g2", title: "Новый ноутбук для учебы", emoji: "💻", currentAmount: 38000, targetAmount: 75000, monthlyContribution: 5000 },
  ],
  familyMembers: [
    { id: "mem_1", name: "Алексей", avatar: "👨‍💻", role: "admin", joinedAt: "2026-01-15" },
    { id: "mem_2", name: "Мария", avatar: "👩‍🎨", role: "member", joinedAt: "2026-01-16" },
  ],
  transactions: [
    {
      id: "t1",
      name: "Супермаркет 'Перекресток'",
      amount: 1420,
      category: "Продукты",
      date: todayStr,
      time: "12:35",
      member: "Алексей",
      source: "text",
    },
    {
      id: "t2",
      name: "Аптека '36.6'",
      amount: 680,
      category: "Здоровье",
      date: todayStr,
      time: "09:15",
      member: "Мария",
      source: "voice",
    },
    {
      id: "t3",
      name: "Заправка Shell (Бензин АИ-95)",
      amount: 2500,
      category: "Транспорт",
      date: yesterdayStr,
      time: "18:40",
      member: "Алексей",
      source: "receipt",
    },
    {
      id: "t4",
      name: "Кафе 'Кофемания' (Обед)",
      amount: 950,
      category: "Кафе и Еда",
      date: yesterdayStr,
      time: "13:20",
      member: "Мария",
      source: "text",
    },
    {
      id: "t5",
      name: "Детский магазин 'Детский Мир'",
      amount: 2100,
      category: "Дети",
      date: yesterdayStr,
      time: "11:00",
      member: "Мария",
      source: "manual",
    },
  ],
  lastUpdated: Date.now(),
};

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): DatabaseSchema {
  ensureDataDirectory();
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
  }
  // Initialize default if not exists
  saveDatabase(defaultDatabase);
  return defaultDatabase;
}

function saveDatabase(db: DatabaseSchema) {
  ensureDataDirectory();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

// In-memory reference initialized from disk
let currentDb: DatabaseSchema = loadDatabase();

// Helper to get Gemini Client if key exists
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// 1. Health check & Server Info
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "SafeDay",
    database: "connected",
    transactionsCount: currentDb.transactions.length,
    lastUpdated: currentDb.lastUpdated,
  });
});

// 2. Full Sync Endpoint (GET /api/family-data)
app.get("/api/family-data", (_req, res) => {
  res.json(currentDb);
});

// 3. Main Offline-First Sync Endpoint (POST /api/sync)
app.post("/api/sync", (req, res) => {
  try {
    const { queue = [] } = req.body;

    // Process queued offline modifications safely
    if (Array.isArray(queue) && queue.length > 0) {
      queue.forEach((item: any) => {
        const { type, payload } = item;
        switch (type) {
          case "ADD_TRANSACTION": {
            // Check if already exists to prevent duplicate inserts
            const exists = currentDb.transactions.some((t) => t.id === payload.id);
            if (!exists) {
              currentDb.transactions.unshift(payload);
            }
            break;
          }
          case "UPDATE_TRANSACTION": {
            currentDb.transactions = currentDb.transactions.map((t) =>
              t.id === payload.id ? { ...t, ...payload } : t
            );
            break;
          }
          case "DELETE_TRANSACTION": {
            currentDb.transactions = currentDb.transactions.filter((t) => t.id !== payload.id);
            break;
          }
          case "UPDATE_CONFIG": {
            currentDb.budgetConfig = { ...currentDb.budgetConfig, ...payload };
            break;
          }
          case "TOGGLE_MANDATORY": {
            currentDb.mandatoryPayments = currentDb.mandatoryPayments.map((p) =>
              p.id === payload.id ? { ...p, isPaid: !p.isPaid } : p
            );
            break;
          }
          case "ADD_MANDATORY": {
            const exists = currentDb.mandatoryPayments.some((p) => p.id === payload.id);
            if (!exists) {
              currentDb.mandatoryPayments.push(payload);
            }
            break;
          }
          case "DELETE_MANDATORY": {
            currentDb.mandatoryPayments = currentDb.mandatoryPayments.filter((p) => p.id !== payload.id);
            break;
          }
          case "DEPOSIT_GOAL": {
            currentDb.familyGoals = currentDb.familyGoals.map((g) =>
              g.id === payload.goalId ? { ...g, currentAmount: g.currentAmount + payload.amount } : g
            );
            break;
          }
          case "ADD_MEMBER": {
            const exists = currentDb.familyMembers?.some((m) => m.id === payload.id);
            if (!exists) {
              if (!currentDb.familyMembers) currentDb.familyMembers = [];
              currentDb.familyMembers.push(payload);
            }
            break;
          }
          case "DELETE_MEMBER": {
            if (currentDb.familyMembers) {
              currentDb.familyMembers = currentDb.familyMembers.filter((m) => m.id !== payload.id);
            }
            break;
          }
          case "RESET_DATA": {
            currentDb = {
              ...defaultDatabase,
              lastUpdated: Date.now(),
            };
            break;
          }
          case "RESTORE_BACKUP": {
            if (payload && payload.budgetConfig && Array.isArray(payload.transactions)) {
              currentDb = {
                budgetConfig: payload.budgetConfig,
                mandatoryPayments: Array.isArray(payload.mandatoryPayments) ? payload.mandatoryPayments : currentDb.mandatoryPayments,
                familyGoals: Array.isArray(payload.familyGoals) ? payload.familyGoals : currentDb.familyGoals,
                familyMembers: Array.isArray(payload.familyMembers) ? payload.familyMembers : currentDb.familyMembers,
                transactions: payload.transactions,
                lastUpdated: Date.now(),
              };
            }
            break;
          }
        }
      });

      currentDb.lastUpdated = Date.now();
      saveDatabase(currentDb);
    }

    res.json(currentDb);
  } catch (error: any) {
    console.error("Error during sync:", error);
    res.status(500).json({ error: "Sync failed", details: error.message });
  }
});

// 4. Reset Data to defaults (POST /api/reset)
app.post("/api/reset", (_req, res) => {
  currentDb = {
    ...defaultDatabase,
    lastUpdated: Date.now(),
  };
  saveDatabase(currentDb);
  res.json({ status: "reset_complete", data: currentDb });
});

// 5. API to parse expense text or voice transcription
app.post("/api/parse-expense", async (req, res) => {
  try {
    const { input, member = "Алексей" } = req.body;
    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "Input text is required" });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Ты — быстрый парсер семейных трат для приложения "SafeDay".
Проанализируй строку расхода пользователя: "${input}"
Категории: ["Продукты", "Транспорт", "Кафе и Еда", "Дети", "Здоровье", "Развлечения", "Дом и ЖКХ", "Покупки", "Прочее"].

Верни СТРОГО чистый JSON:
{
  "amount": <число, сумма расхода в рублях>,
  "category": "<название категории из списка>",
  "name": "<краткое понятное описание расхода, например 'Аптека', 'Заправка Shell', 'Обед'>"
}`,
        });

        const textResponse = response.text || "";
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            amount: Number(parsed.amount) || 0,
            category: parsed.category || "Прочее",
            name: parsed.name || input,
            member,
            parsedBy: "gemini",
          });
        }
      } catch (geminiError) {
        console.warn("Gemini parse failed, falling back to local heuristic:", geminiError);
      }
    }

    // Heuristic fallback
    const parsedFallback = parseExpenseHeuristic(input, member);
    return res.json(parsedFallback);
  } catch (error: any) {
    console.error("Error parsing expense:", error);
    res.status(500).json({ error: error.message || "Failed to parse expense" });
  }
});

// Local heuristic parser function
function parseExpenseHeuristic(input: string, member: string) {
  const cleanInput = input.trim().toLowerCase();
  
  // Extract digits
  const numbers = cleanInput.match(/\d+(\s*\d+)*/g);
  let amount = 0;
  if (numbers && numbers.length > 0) {
    amount = parseInt(numbers[0].replace(/\s+/g, ""), 10);
  }

  // Determine category & name
  let category = "Прочее";
  let name = input.replace(/\d+/g, "").trim() || "Расход";

  if (/аптек|лекарств|врач|больниц|клиник|доктор|витамин/.test(cleanInput)) {
    category = "Здоровье";
  } else if (/заправк|бензин|такси|метро|авто|парковк|машин|автобус|проезд|газ/.test(cleanInput)) {
    category = "Транспорт";
  } else if (/продукт|магнит|пятерочк|перекресток|ашан|лента|вкуссвилл|еда|молоко|хлеб|супермаркет/.test(cleanInput)) {
    category = "Продукты";
  } else if (/кафе|ресторан|кофе|кофейн|обед|ужин|пицца|суши|бургер|доставка/.test(cleanInput)) {
    category = "Кафе и Еда";
  } else if (/сад|садик|школ|игрушк|подгузник|детск|ребенок|одежда детям/.test(cleanInput)) {
    category = "Дети";
  } else if (/жкх|ипотек|аренд|коммунал|электричеств|газ|интернет|связь|телефон/.test(cleanInput)) {
    category = "Дом и ЖКХ";
  } else if (/кино|театр|парк|билет|концерт|игра|подписк/.test(cleanInput)) {
    category = "Развлечения";
  } else if (/одежд|обувь|сумк|подарок|магазин|вайлдберри|ozon|озон/.test(cleanInput)) {
    category = "Покупки";
  }

  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  } else {
    name = category;
  }

  return {
    amount,
    category,
    name,
    member,
    parsedBy: "heuristic",
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SafeDay Server] running on http://localhost:${PORT}`);
  });
}

startServer();

