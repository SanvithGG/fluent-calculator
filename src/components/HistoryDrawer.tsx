import { useState } from "react";
import { HistoryItem } from "@/lib/storage";
import { Button } from "./ui/button";
import { Trash2, X, History, Database, Copy, Check } from "lucide-react";
import { playKeyClick } from "@/lib/sound";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  memory: number[];
  onClearMemory: () => void;
  onSelectHistoryResult?: (res: string) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onDeleteHistoryItem,
  memory,
  onClearMemory,
  onSelectHistoryResult,
}: HistoryDrawerProps) {
  const [tab, setTab] = useState<"history" | "memory">("history");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    playKeyClick("action");
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    if (onSelectHistoryResult) {
      onSelectHistoryResult(text);
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-150">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-border/50 px-3">
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
              tab === "history"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="size-3" />
            <span>History</span>
          </button>
          <button
            onClick={() => setTab("memory")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
              tab === "memory"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="size-3" />
            <span>Memory ({memory.length})</span>
          </button>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2">
        {tab === "history" ? (
          history.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <History className="size-8 opacity-30" />
              <p className="text-xs">There's no history yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCopy(item.result, item.id)}
                  className="group relative flex flex-col items-end rounded-lg p-2 transition-colors hover:bg-muted/60 border border-transparent hover:border-border/60 cursor-pointer"
                >
                  <span className="text-[11px] text-muted-foreground font-mono truncate max-w-full">
                    {item.expression}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold font-mono text-foreground">
                      = {item.result}
                    </span>
                    {copiedId === item.id ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistoryItem(item.id);
                    }}
                    className="absolute top-1.5 left-1.5 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete item"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : memory.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Database className="size-8 opacity-30" />
            <p className="text-xs">There's nothing saved in memory</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {memory.map((val, idx) => (
              <div
                key={idx}
                onClick={() => handleCopy(String(val), String(idx))}
                className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/60 border border-transparent hover:border-border/60 cursor-pointer"
              >
                <span className="text-[11px] text-muted-foreground">M[{idx + 1}]</span>
                <span className="text-base font-bold font-mono text-foreground">
                  {val.toLocaleString("en-US", { maximumFractionDigits: 10 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Clear Bar */}
      {((tab === "history" && history.length > 0) ||
        (tab === "memory" && memory.length > 0)) && (
        <div className="flex items-center justify-end border-t border-border/50 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={tab === "history" ? onClearHistory : onClearMemory}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
            <span>Clear all</span>
          </Button>
        </div>
      )}
    </div>
  );
}
