import React, { useState, useEffect } from "react";
import {
  Calculator,
  Binary,
  Atom,
  ArrowRightLeft,
  Calendar,
  Pin,
  PinOff,
  History,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Minus,
  Square,
  Copy,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  Expand,
  Shrink,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";

export type CalculatorMode =
  | "standard"
  | "scientific"
  | "programmer"
  | "converter"
  | "date";

interface TitleBarProps {
  currentMode: CalculatorMode;
  onSelectMode: (mode: CalculatorMode) => void;
  onToggleHistory: () => void;
  historyOpen: boolean;
  theme: "system" | "dark" | "light";
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isAlwaysOnTop: boolean;
  onToggleAlwaysOnTop: () => void;
  isCompact: boolean;
  onToggleCompact: () => void;
  isWideScreen?: boolean;
}

export function TitleBar({
  currentMode,
  onSelectMode,
  onToggleHistory,
  historyOpen,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  isAlwaysOnTop,
  onToggleAlwaysOnTop,
  isCompact,
  onToggleCompact,
  isWideScreen,
}: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);

  // Check window maximized & fullscreen state
  useEffect(() => {
    async function checkState() {
      try {
        const max = await invoke<boolean>("is_window_maximized");
        setIsMaximized(max);
      } catch {}
      try {
        const fs = await invoke<boolean>("is_window_fullscreen");
        setIsFullscreen(fs);
      } catch {}
    }
    checkState();
  }, []);

  // Listen for F11 full screen shortcut
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMinimize = async () => {
    try {
      await invoke("minimize_window");
    } catch {}
  };

  const handleToggleMaximize = async () => {
    try {
      const max = await invoke<boolean>("toggle_maximize");
      setIsMaximized(max);
    } catch {
      setIsMaximized(!isMaximized);
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      const fs = await invoke<boolean>("toggle_fullscreen");
      setIsFullscreen(fs);
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleClose = async () => {
    try {
      await invoke("close_window");
    } catch {
      window.close();
    }
  };

  const modes: { id: CalculatorMode; label: string; icon: React.ReactNode }[] = [
    { id: "standard", label: "Standard", icon: <Calculator className="size-4" /> },
    { id: "scientific", label: "Scientific", icon: <Atom className="size-4" /> },
    { id: "programmer", label: "Programmer", icon: <Binary className="size-4" /> },
    { id: "converter", label: "Unit Converter", icon: <ArrowRightLeft className="size-4" /> },
    { id: "date", label: "Date Calculation", icon: <Calendar className="size-4" /> },
  ];

  const currentModeObj = modes.find((m) => m.id === currentMode) || modes[0];

  return (
    <div
      data-tauri-drag-region
      className="flex h-11 w-full items-center justify-between border-b border-border/40 bg-background/85 px-3 select-none z-50 backdrop-blur-xl"
    >
      {/* Left: Mode Picker */}
      <div className="relative flex items-center gap-1.5" data-tauri-drag-region>
        <button
          onClick={() => setModeMenuOpen(!modeMenuOpen)}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors border border-border/40 shadow-xs"
          title="Switch calculator mode"
        >
          <span className="text-primary">{currentModeObj.icon}</span>
          <span className="truncate">{currentModeObj.label}</span>
          <ChevronDown className="size-3 text-muted-foreground opacity-70" />
        </button>

        {modeMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setModeMenuOpen(false)}
            />
            <div className="absolute top-9 left-0 z-50 w-52 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Calculator Modes
              </div>
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectMode(m.id);
                    setModeMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                    currentMode === m.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {isWideScreen && (
          <span className="hidden md:inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            Pro Studio View
          </span>
        )}
      </div>

      {/* Middle Drag Region */}
      <div className="flex-1 h-full flex items-center justify-center" data-tauri-drag-region />

      {/* Right: Quick actions & Window Controls */}
      <div className="flex items-center gap-1">
        {/* Full Screen Mode Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleToggleFullscreen}
          className={`h-7 w-7 transition-colors ${
            isFullscreen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          }`}
          title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
        >
          {isFullscreen ? <Shrink className="size-3.5" /> : <Expand className="size-3.5" />}
        </Button>

        {/* Compact Mode Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCompact}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title={isCompact ? "Expand window" : "Compact mini view"}
        >
          {isCompact ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
        </Button>

        {/* Always on top Pin */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleAlwaysOnTop}
          className={`h-7 w-7 transition-colors ${
            isAlwaysOnTop
              ? "text-primary bg-primary/10 hover:bg-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={isAlwaysOnTop ? "Unpin from top" : "Keep on top (Pin)"}
        >
          {isAlwaysOnTop ? <Pin className="size-3.5 fill-current" /> : <PinOff className="size-3.5" />}
        </Button>

        {/* History Toggle (in compact mode) */}
        {!isWideScreen && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleHistory}
            className={`h-7 w-7 transition-colors ${
              historyOpen
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Calculation History & Memory"
          >
            <History className="size-3.5" />
          </Button>
        )}

        {/* Sound Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSound}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title={soundEnabled ? "Mute clicks" : "Enable sound clicks"}
        >
          {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleTheme}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Toggle Dark/Light Mode"
        >
          {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        </Button>

        {/* Native Windows Controls */}
        <div className="ml-1 flex items-center">
          <button
            onClick={handleMinimize}
            className="flex h-7 w-9 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Minimize"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            onClick={handleToggleMaximize}
            className="flex h-7 w-9 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Copy className="size-3" /> : <Square className="size-3" />}
          </button>
          <button
            onClick={handleClose}
            className="flex h-7 w-9 items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
