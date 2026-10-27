import { useState, useMemo } from "react";
import { HistoryItem } from "@/lib/storage";
import { Button } from "./ui/button";
import {
  Trash2,
  X,
  History,
  Database,
  Copy,
  Check,
  Search,
  ArrowUpRight,
  Calculator,
  Coins,
  RefreshCw,
} from "lucide-react";
import { playKeyClick } from "@/lib/sound";

interface HistorySidecarProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  memory: number[];
  onClearMemory: () => void;
  onRecallExpression?: (expr: string) => void;
  onUseResult?: (res: string) => void;
  isPersistent?: boolean;
  onClose?: () => void;
  activeDisplayValue?: string;
}

export function HistorySidecar({
  history,
  onClearHistory,
  onDeleteHistoryItem,
  memory,
  onClearMemory,
  onRecallExpression,
  onUseResult,
  isPersistent = false,
  onClose,
  activeDisplayValue = "0",
}: HistorySidecarProps) {
  const [tab, setTab] = useState<"history" | "memory">("history");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const click = () => playKeyClick("action");

  // Filter history items by search query
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(
      (item) =>
        item.expression.toLowerCase().includes(q) ||
        item.result.toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  // Financial tape statistics
  const tapeStats = useMemo(() => {
    const validNums = history
      .map((h) => parseFloat(h.result))
      .filter((n) => !isNaN(n) && isFinite(n));

    if (validNums.length === 0) return null;

    const sum = validNums.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / validNums.length;

    return {
      count: validNums.length,
      sum: sum.toLocaleString("en-US", { maximumFractionDigits: 6 }),
      avg: avg.toLocaleString("en-US", { maximumFractionDigits: 4 }),
    };
  }, [history]);

  // Quick Currency / Unit Glance for current display value
  const quickConversions = useMemo(() => {
    const num = parseFloat(activeDisplayValue);
    if (isNaN(num) || num === 0) return null;

    return [
      { label: "USD -> EUR", val: `€ ${(num * 0.92).toFixed(2)}` },
      { label: "USD -> GBP", val: `£ ${(num * 0.78).toFixed(2)}` },
      { label: "USD -> INR", val: `₹ ${(num * 83.3).toFixed(2)}` },
      { label: "Meters -> Feet", val: `${(num * 3.28084).toFixed(2)} ft` },
      { label: "Kg -> Pounds", val: `${(num * 2.20462).toFixed(2)} lb` },
    ];
  }, [activeDisplayValue]);

  const handleCopy = (text: string, id: string) => {
    click();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    if (onUseResult) onUseResult(text);
  };

  return (
    <div
      className={`flex flex-col border-l border-border/40 bg-card/60 backdrop-blur-xl select-none h-full ${
        isPersistent
          ? "w-72 xl:w-80"
          : "absolute inset-y-0 right-0 z-40 w-72 shadow-2xl animate-in slide-in-from-right duration-150"
      }`}
    >
      {/* Sidecar Header */}
      <div className="flex h-11 items-center justify-between border-b border-border/40 px-3">
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => {
              click();
              setTab("history");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              tab === "history"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="size-3" />
            <span>Tape ({history.length})</span>
          </button>
          <button
            onClick={() => {
              click();
              setTab("memory");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              tab === "memory"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="size-3" />
            <span>Memory ({memory.length})</span>
          </button>
        </div>

        {!isPersistent && onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Search Input in History */}
      {tab === "history" && history.length > 3 && (
        <div className="p-2 border-b border-border/40">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search past equations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-muted/50 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {tab === "history" ? (
          filteredHistory.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <History className="size-8 opacity-25" />
              <p className="text-xs">No calculations yet</p>
              <span className="text-[10px] opacity-60">
                Your calculation tape will record equations here
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCopy(item.result, item.id)}
                  className="group relative flex flex-col items-end rounded-xl p-2.5 transition-all hover:bg-muted/70 border border-border/30 hover:border-border/80 cursor-pointer shadow-xs"
                >
                  <div className="flex w-full items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="opacity-60">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="truncate max-w-[180px] text-right font-medium text-foreground/80">
                      {item.expression}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold font-mono text-primary">
                      = {item.result}
                    </span>
                    {copiedId === item.id ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                    {onRecallExpression && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecallExpression(item.expression);
                        }}
                        className="text-primary hover:underline flex items-center gap-0.5"
                      >
                        <ArrowUpRight className="size-3" />
                        Recall
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistoryItem(item.id);
                      }}
                      className="text-muted-foreground hover:text-destructive flex items-center gap-0.5 ml-2"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : memory.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Database className="size-8 opacity-25" />
            <p className="text-xs">Memory is empty</p>
            <span className="text-[10px] opacity-60">
              Use MS to store values into memory registers
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {memory.map((val, idx) => (
              <div
                key={idx}
                onClick={() => handleCopy(String(val), String(idx))}
                className="group flex items-center justify-between rounded-xl p-2.5 transition-all hover:bg-muted/70 border border-border/30 hover:border-border/80 cursor-pointer shadow-xs"
              >
                <span className="text-xs font-semibold text-primary font-mono">
                  M[{idx + 1}]
                </span>
                <span className="text-base font-bold font-mono text-foreground">
                  {val.toLocaleString("en-US", { maximumFractionDigits: 10 })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Quick Glance Live Conversions in Full Screen View */}
        {quickConversions && (
          <div className="mt-3 rounded-xl bg-muted/30 p-2.5 border border-border/40 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase">
              <span className="flex items-center gap-1">
                <Coins className="size-3 text-primary" />
                Live Quick Glance
              </span>
              <span className="font-mono">{activeDisplayValue}</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {quickConversions.slice(0, 3).map((conv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-0.5 text-[11px]"
                >
                  <span className="text-muted-foreground">{conv.label}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {conv.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats & Clear All Button */}
      <div className="flex flex-col border-t border-border/40 p-2.5 gap-2 bg-background/50">
        {tab === "history" && tapeStats && (
          <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground text-center font-mono py-1 bg-muted/40 rounded-lg">
            <div>
              <span className="block opacity-60">COUNT</span>
              <span className="font-bold text-foreground">{tapeStats.count}</span>
            </div>
            <div>
              <span className="block opacity-60">AVG</span>
              <span className="font-bold text-foreground truncate max-w-[80px]">
                {tapeStats.avg}
              </span>
            </div>
            <div>
              <span className="block opacity-60">SUM</span>
              <span className="font-bold text-primary truncate max-w-[80px]">
                {tapeStats.sum}
              </span>
            </div>
          </div>
        )}

        {((tab === "history" && history.length > 0) ||
          (tab === "memory" && memory.length > 0)) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={tab === "history" ? onClearHistory : onClearMemory}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive h-8"
          >
            <Trash2 className="size-3.5" />
            <span>Clear {tab === "history" ? "Tape History" : "All Memory"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
