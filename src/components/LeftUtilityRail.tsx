import React from "react";
import {
  Calculator,
  Binary,
  Atom,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  Keyboard,
  Info,
} from "lucide-react";
import { CalculatorMode } from "./TitleBar";

interface LeftUtilityRailProps {
  currentMode: CalculatorMode;
  onSelectMode: (mode: CalculatorMode) => void;
  onInsertConstant?: (value: number, symbol: string) => void;
}

export function LeftUtilityRail({
  currentMode,
  onSelectMode,
  onInsertConstant,
}: LeftUtilityRailProps) {
  const modes: { id: CalculatorMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "standard",
      label: "Standard",
      icon: <Calculator className="size-4" />,
      desc: "Daily math & arithmetic",
    },
    {
      id: "scientific",
      label: "Scientific",
      icon: <Atom className="size-4" />,
      desc: "Trig, logs & exponents",
    },
    {
      id: "programmer",
      label: "Programmer",
      icon: <Binary className="size-4" />,
      desc: "HEX, BIN & 64-bit bits",
    },
    {
      id: "converter",
      label: "Unit Converter",
      icon: <ArrowRightLeft className="size-4" />,
      desc: "Currency, length, weight",
    },
    {
      id: "date",
      label: "Date Calc",
      icon: <Calendar className="size-4" />,
      desc: "Days difference & duration",
    },
  ];

  const scientificConstants = [
    { symbol: "π", name: "Pi", value: Math.PI },
    { symbol: "e", name: "Euler's", value: Math.E },
    { symbol: "φ", name: "Golden Ratio", value: 1.6180339887 },
    { symbol: "c", name: "Light Speed", value: 299792458 },
    { symbol: "G", name: "Gravitational", value: 6.6743e-11 },
    { symbol: "h", name: "Planck", value: 6.62607015e-34 },
  ];

  return (
    <div className="flex h-full w-56 flex-col border-r border-border/40 bg-card/40 p-3 backdrop-blur-xl select-none justify-between overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* Modes Section */}
        <div className="flex flex-col gap-1">
          <span className="px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Modes
          </span>
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all text-left group ${
                currentMode === m.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
                  : "text-foreground hover:bg-muted/70"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  currentMode === m.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-primary group-hover:scale-105 transition-transform"
                }`}
              >
                {m.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs">{m.label}</span>
                <span
                  className={`text-[10px] ${
                    currentMode === m.id ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {m.desc}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Constants Section (Raycast/Numworks Style) */}
        {onInsertConstant && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
                <Sparkles className="size-3 text-primary" />
                Constants
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              {scientificConstants.map((c) => (
                <button
                  key={c.symbol}
                  onClick={() => onInsertConstant(c.value, c.symbol)}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-2 py-1.5 text-xs hover:bg-muted active:scale-95 transition-all border border-border/40"
                  title={`${c.name} (${c.value})`}
                >
                  <span className="font-mono font-bold text-primary">{c.symbol}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[55px]">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Hint Footer */}
      <div className="flex flex-col gap-1 rounded-xl bg-muted/30 p-2.5 border border-border/40 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Keyboard className="size-3 text-primary" />
          <span>Keyboard Ready</span>
        </div>
        <p className="leading-tight text-[10px]">
          Numpad, <kbd className="px-1 py-0.5 bg-muted rounded font-mono">Enter</kbd> to calc,{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded font-mono">Esc</kbd> clear,{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded font-mono">F11</kbd> fullscreen.
        </p>
      </div>
    </div>
  );
}
