// Local storage and history persistence manager

export interface HistoryItem {
  id: string;
  mode: string;
  expression: string;
  result: string;
  timestamp: number;
}

const HISTORY_KEY = "calculator_history";
const MEMORY_KEY = "calculator_memory";
const SETTINGS_KEY = "calculator_settings";

export interface Settings {
  theme: "system" | "dark" | "light";
  angleUnit: "deg" | "rad";
  soundEnabled: boolean;
  alwaysOnTop: boolean;
  wordSize: "QWORD" | "DWORD" | "WORD" | "BYTE";
}

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  angleUnit: "deg",
  soundEnabled: true,
  alwaysOnTop: false,
  wordSize: "QWORD",
};

export function getStoredHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, "id" | "timestamp">): HistoryItem {
  const newItem: HistoryItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
  };

  try {
    const list = getStoredHistory();
    const updated = [newItem, ...list].slice(0, 100); // keep last 100
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // quota exceeded or storage disabled
  }

  return newItem;
}

export function clearStoredHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

export function removeHistoryItem(id: string): void {
  try {
    const list = getStoredHistory().filter((i) => i.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {}
}

export function getStoredMemory(): number[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMemory(list: number[]): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(list));
  } catch {}
}

export function getStoredSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<Settings>): Settings {
  try {
    const current = getStoredSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
