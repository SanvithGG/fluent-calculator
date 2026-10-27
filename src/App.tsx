import { useState, useEffect, useCallback } from "react";
import { TitleBar, CalculatorMode } from "./components/TitleBar";
import { StandardCalculator } from "./components/StandardCalculator";
import { ScientificCalculator } from "./components/ScientificCalculator";
import { ProgrammerCalculator } from "./components/ProgrammerCalculator";
import { ConverterScreen } from "./components/ConverterScreen";
import { DateCalculator } from "./components/DateCalculator";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { Toaster, toast } from "sonner";
import {
  getStoredHistory,
  saveHistoryItem,
  clearStoredHistory,
  removeHistoryItem,
  getStoredMemory,
  saveMemory,
  getStoredSettings,
  saveSettings,
  HistoryItem,
} from "./lib/storage";
import { WordSize, AngleMode } from "./lib/calculator-engine";
import { invoke } from "@tauri-apps/api/core";

export default function App() {
  const [currentMode, setCurrentMode] = useState<CalculatorMode>("standard");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [memory, setMemory] = useState<number[]>([]);
  const [theme, setTheme] = useState<"system" | "dark" | "light">("system");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [wordSize, setWordSize] = useState<WordSize>("QWORD");
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");

  // Load initial settings and history
  useEffect(() => {
    const s = getStoredSettings();
    setTheme(s.theme);
    setSoundEnabled(s.soundEnabled);
    setIsAlwaysOnTop(s.alwaysOnTop);
    setWordSize(s.wordSize);
    setAngleMode(s.angleUnit);

    setHistory(getStoredHistory());
    setMemory(getStoredMemory());

    // Apply theme
    applyThemeClass(s.theme);
  }, []);

  const applyThemeClass = (t: "system" | "dark" | "light") => {
    const isDark =
      t === "dark" ||
      (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("calculator_theme", t);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyThemeClass(nextTheme);
    saveSettings({ theme: nextTheme });
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem("calculator_sound", String(nextVal));
    saveSettings({ soundEnabled: nextVal });
  };

  const handleToggleAlwaysOnTop = async () => {
    const nextVal = !isAlwaysOnTop;
    setIsAlwaysOnTop(nextVal);
    saveSettings({ alwaysOnTop: nextVal });
    try {
      await invoke("set_always_on_top", { alwaysOnTop: nextVal });
    } catch {
      // In web preview fallback
    }
  };

  const handleToggleCompact = async () => {
    const nextVal = !isCompact;
    setIsCompact(nextVal);
    try {
      await invoke("set_compact_mode", { compact: nextVal });
    } catch {
      // In web preview fallback
    }
  };

  const handleSaveHistory = useCallback(
    (expr: string, res: string) => {
      const saved = saveHistoryItem({
        mode: currentMode,
        expression: expr,
        result: res,
      });
      setHistory((prev) => [saved, ...prev].slice(0, 100));
    },
    [currentMode]
  );

  const handleClearHistory = () => {
    clearStoredHistory();
    setHistory([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    removeHistoryItem(id);
    setHistory((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateMemory = (newMem: number[]) => {
    setMemory(newMem);
    saveMemory(newMem);
  };

  const handleClearMemory = () => {
    setMemory([]);
    saveMemory([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground select-none overflow-hidden relative font-sans">
      <Toaster position="top-center" richColors theme={theme === "dark" ? "dark" : "light"} />

      {/* Modern Fluent Window TitleBar */}
      <TitleBar
        currentMode={currentMode}
        onSelectMode={(m) => setCurrentMode(m)}
        onToggleHistory={() => setHistoryOpen(!historyOpen)}
        historyOpen={historyOpen}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isAlwaysOnTop={isAlwaysOnTop}
        onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
        isCompact={isCompact}
        onToggleCompact={handleToggleCompact}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {currentMode === "standard" && (
            <StandardCalculator
              onSaveHistory={handleSaveHistory}
              memory={memory}
              onUpdateMemory={handleUpdateMemory}
            />
          )}

          {currentMode === "scientific" && (
            <ScientificCalculator
              onSaveHistory={handleSaveHistory}
              angleMode={angleMode}
              onToggleAngleMode={() => {
                const next = angleMode === "deg" ? "rad" : "deg";
                setAngleMode(next);
                saveSettings({ angleUnit: next });
              }}
              memory={memory}
              onUpdateMemory={handleUpdateMemory}
            />
          )}

          {currentMode === "programmer" && (
            <ProgrammerCalculator
              onSaveHistory={handleSaveHistory}
              wordSize={wordSize}
              onChangeWordSize={(ws) => {
                setWordSize(ws);
                saveSettings({ wordSize: ws });
              }}
            />
          )}

          {currentMode === "converter" && <ConverterScreen />}

          {currentMode === "date" && <DateCalculator />}
        </div>

        {/* History and Memory Drawer */}
        <HistoryDrawer
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={history}
          onClearHistory={handleClearHistory}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          memory={memory}
          onClearMemory={handleClearMemory}
          onSelectHistoryResult={(res) => {
            toast.success(`Copied "${res}" to clipboard`);
          }}
        />
      </div>
    </div>
  );
}
