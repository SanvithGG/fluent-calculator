import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import {
  formatDisplayNumber,
  sanitizeFloat,
  calculateTrig,
  factorial,
  AngleMode,
} from "@/lib/calculator-engine";
import { playKeyClick } from "@/lib/sound";
import {
  Delete,
  Divide,
  Plus,
  Minus,
  X,
  Equal,
  Percent,
  Copy,
  Check,
  CornerDownLeft,
} from "lucide-react";

interface StandardCalculatorProps {
  onSaveHistory: (expr: string, res: string) => void;
  memory: number[];
  onUpdateMemory: (mem: number[]) => void;
  isWideScreen?: boolean;
  angleMode?: AngleMode;
  onToggleAngleMode?: () => void;
  onDisplayChange?: (val: string) => void;
}

export function StandardCalculator({
  onSaveHistory,
  memory,
  onUpdateMemory,
  isWideScreen = false,
  angleMode = "deg",
  onToggleAngleMode,
  onDisplayChange,
}: StandardCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<number | null>(null);

  // Sync active display to parent (for live quick glance widgets)
  useEffect(() => {
    if (onDisplayChange) {
      onDisplayChange(display);
    }
  }, [display, onDisplayChange]);

  const click = (type: "number" | "operator" | "equals" | "clear" | "action" = "number") => {
    playKeyClick(type);
  };

  // Live evaluated ghost preview
  const livePreview = useMemo(() => {
    if (prevValue === null || !pendingOp || waitingForOperand) return null;
    const current = parseFloat(display);
    if (isNaN(current)) return null;

    let res = 0;
    switch (pendingOp) {
      case "+":
        res = prevValue + current;
        break;
      case "-":
        res = prevValue - current;
        break;
      case "*":
        res = prevValue * current;
        break;
      case "/":
        res = current === 0 ? NaN : prevValue / current;
        break;
      case "pow":
        res = Math.pow(prevValue, current);
        break;
      case "mod":
        res = prevValue % current;
        break;
      default:
        return null;
    }
    if (isNaN(res) || !isFinite(res)) return null;
    return sanitizeFloat(res);
  }, [prevValue, pendingOp, display, waitingForOperand]);

  // Input digit
  const inputDigit = useCallback(
    (digit: string) => {
      click("number");
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
      } else {
        if (display === "0" && digit !== ".") {
          setDisplay(digit);
        } else if (display.length < 16) {
          setDisplay(display + digit);
        }
      }
    },
    [display, waitingForOperand]
  );

  // Decimal point
  const inputDecimal = useCallback(() => {
    click("number");
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand]);

  // Backspace
  const handleBackspace = useCallback(() => {
    click("clear");
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  }, [display, waitingForOperand]);

  // Clear & Clear Entry
  const handleClear = useCallback(() => {
    click("clear");
    setDisplay("0");
    setExpression("");
    setPrevValue(null);
    setPendingOp(null);
    setWaitingForOperand(false);
  }, []);

  const handleClearEntry = useCallback(() => {
    click("clear");
    setDisplay("0");
  }, []);

  // Invert Sign (±)
  const handleToggleSign = useCallback(() => {
    click("operator");
    const num = parseFloat(display);
    if (!isNaN(num) && num !== 0) {
      setDisplay(String(-num));
    }
  }, [display]);

  // Perform binary calculation
  const executeOperation = (first: number, second: number, op: string): number => {
    switch (op) {
      case "+":
        return sanitizeFloat(first + second);
      case "-":
        return sanitizeFloat(first - second);
      case "*":
        return sanitizeFloat(first * second);
      case "/":
        return second === 0 ? NaN : sanitizeFloat(first / second);
      case "pow":
        return sanitizeFloat(Math.pow(first, second));
      case "mod":
        return sanitizeFloat(first % second);
      default:
        return second;
    }
  };

  // Binary operator clicked
  const handleOperator = useCallback(
    (nextOp: string) => {
      click("operator");
      const inputValue = parseFloat(display);

      if (prevValue === null) {
        setPrevValue(inputValue);
      } else if (pendingOp && !waitingForOperand) {
        const result = executeOperation(prevValue, inputValue, pendingOp);
        setDisplay(String(result));
        setPrevValue(result);
      }

      setWaitingForOperand(true);
      setPendingOp(nextOp);

      const symbolMap: Record<string, string> = {
        "*": "×",
        "/": "÷",
        pow: "^",
        mod: "mod",
      };
      const opSymbol = symbolMap[nextOp] || nextOp;
      setExpression(
        `${prevValue !== null && pendingOp && !waitingForOperand ? prevValue : inputValue} ${opSymbol}`
      );
    },
    [display, prevValue, pendingOp, waitingForOperand]
  );

  // Equals (=)
  const handleEquals = useCallback(() => {
    click("equals");
    const current = parseFloat(display);

    if (prevValue !== null && pendingOp) {
      const result = executeOperation(prevValue, current, pendingOp);
      const symbolMap: Record<string, string> = {
        "*": "×",
        "/": "÷",
        pow: "^",
        mod: "mod",
      };
      const opSymbol = symbolMap[pendingOp] || pendingOp;
      const fullExpr = `${prevValue} ${opSymbol} ${current} =`;

      if (isNaN(result)) {
        setDisplay("Error");
      } else {
        setDisplay(String(result));
        setLastAnswer(result);
        onSaveHistory(fullExpr, String(result));
      }

      setExpression(fullExpr);
      setPrevValue(null);
      setPendingOp(null);
      setWaitingForOperand(true);
    }
  }, [display, prevValue, pendingOp, onSaveHistory]);

  // Unary operations (sqrt, square, reciprocal, trig, log)
  const handleUnaryOp = useCallback(
    (op: "sqrt" | "sqr" | "cube" | "recip" | "fact" | "abs" | "sin" | "cos" | "tan" | "ln" | "log10" | "exp" | "tenPow") => {
      click("operator");
      const current = parseFloat(display);
      if (isNaN(current)) return;

      let res = current;
      let exprText = "";

      switch (op) {
        case "sqrt":
          if (current < 0) {
            setDisplay("Invalid Input");
            return;
          }
          res = sanitizeFloat(Math.sqrt(current));
          exprText = `√(${display})`;
          break;
        case "sqr":
          res = sanitizeFloat(current * current);
          exprText = `sqr(${display})`;
          break;
        case "cube":
          res = sanitizeFloat(current * current * current);
          exprText = `cube(${display})`;
          break;
        case "recip":
          if (current === 0) {
            setDisplay("Cannot divide by zero");
            return;
          }
          res = sanitizeFloat(1 / current);
          exprText = `1/(${display})`;
          break;
        case "fact":
          res = factorial(current);
          exprText = `fact(${display})`;
          break;
        case "abs":
          res = Math.abs(current);
          exprText = `abs(${display})`;
          break;
        case "sin":
        case "cos":
        case "tan":
          res = calculateTrig(op, current, angleMode);
          exprText = `${op}(${display})`;
          break;
        case "ln":
          if (current <= 0) {
            setDisplay("Invalid Input");
            return;
          }
          res = sanitizeFloat(Math.log(current));
          exprText = `ln(${display})`;
          break;
        case "log10":
          if (current <= 0) {
            setDisplay("Invalid Input");
            return;
          }
          res = sanitizeFloat(Math.log10(current));
          exprText = `log(${display})`;
          break;
        case "exp":
          res = sanitizeFloat(Math.exp(current));
          exprText = `e^(${display})`;
          break;
        case "tenPow":
          res = sanitizeFloat(Math.pow(10, current));
          exprText = `10^(${display})`;
          break;
      }

      setDisplay(String(res));
      setExpression(exprText);
      setWaitingForOperand(true);
      onSaveHistory(exprText, String(res));
    },
    [display, angleMode, onSaveHistory]
  );

  // Percentage
  const handlePercent = useCallback(() => {
    click("operator");
    const current = parseFloat(display);
    if (isNaN(current)) return;

    let res = 0;
    if (prevValue !== null && pendingOp) {
      res = sanitizeFloat((prevValue * current) / 100);
    } else {
      res = sanitizeFloat(current / 100);
    }

    setDisplay(String(res));
    setWaitingForOperand(true);
  }, [display, prevValue, pendingOp]);

  // Insert Constant or Recall Ans
  const handleConstant = (val: number, symbol: string) => {
    click("number");
    setDisplay(String(val));
    setExpression(symbol);
    setWaitingForOperand(true);
  };

  const handleRecallAns = () => {
    if (lastAnswer !== null) {
      click("number");
      setDisplay(String(lastAnswer));
      setWaitingForOperand(true);
    }
  };

  // Copy to clipboard
  const handleCopyDisplay = () => {
    click("action");
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        inputDecimal();
      } else if (e.key === "+") {
        e.preventDefault();
        handleOperator("+");
      } else if (e.key === "-") {
        e.preventDefault();
        handleOperator("-");
      } else if (e.key === "*") {
        e.preventDefault();
        handleOperator("*");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperator("/");
      } else if (e.key === "%") {
        e.preventDefault();
        handlePercent();
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    inputDigit,
    inputDecimal,
    handleOperator,
    handlePercent,
    handleEquals,
    handleBackspace,
    handleClear,
  ]);

  const hasMemory = memory.length > 0;

  return (
    <div className="flex flex-col h-full w-full justify-between p-3 sm:p-5 gap-3 max-w-5xl mx-auto">
      {/* Colossal Multi-Tier Display Card (Raycast x Fluent Mica style) */}
      <div className="flex flex-col items-end justify-end px-4 py-3 min-h-[105px] sm:min-h-[125px] rounded-2xl bg-card/70 border border-border/60 shadow-lg backdrop-blur-2xl relative overflow-hidden group">
        {/* Top Breadcrumb & Live Ghost Preview */}
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            {onToggleAngleMode && isWideScreen && (
              <button
                onClick={onToggleAngleMode}
                className="text-[10px] font-bold uppercase tracking-wider bg-muted/60 hover:bg-muted text-primary px-2 py-0.5 rounded-md border border-border/40 transition-colors"
              >
                {angleMode.toUpperCase()}
              </button>
            )}
            {hasMemory && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                M ({memory.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 truncate max-w-[70%]">
            <span className="truncate">{expression}</span>
            {livePreview !== null && (
              <span className="text-primary/70 font-semibold animate-pulse">
                = {livePreview.toLocaleString("en-US")}
              </span>
            )}
          </div>
        </div>

        {/* Huge Result Numerals */}
        <div className="w-full flex items-center justify-between mt-1">
          <button
            onClick={handleCopyDisplay}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60"
            title="Copy result"
          >
            {copied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
          <div className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground truncate font-mono text-right transition-all">
            {formatDisplayNumber(display)}
          </div>
        </div>
      </div>

      {/* Memory Chips Bar */}
      <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-muted-foreground">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasMemory}
            onClick={() => {
              click("clear");
              onUpdateMemory([]);
            }}
            className="h-7 text-[11px] px-2.5"
          >
            MC
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasMemory}
            onClick={() => {
              click("action");
              if (memory.length > 0) {
                setDisplay(String(memory[0]));
                setWaitingForOperand(true);
              }
            }}
            className="h-7 text-[11px] px-2.5"
          >
            MR
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              click("action");
              const current = parseFloat(display);
              if (!isNaN(current) && memory.length > 0) {
                const updated = [...memory];
                updated[0] = sanitizeFloat(updated[0] + current);
                onUpdateMemory(updated);
              } else if (!isNaN(current)) {
                onUpdateMemory([current]);
              }
            }}
            className="h-7 text-[11px] px-2.5"
          >
            M+
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              click("action");
              const current = parseFloat(display);
              if (!isNaN(current) && memory.length > 0) {
                const updated = [...memory];
                updated[0] = sanitizeFloat(updated[0] - current);
                onUpdateMemory(updated);
              } else if (!isNaN(current)) {
                onUpdateMemory([-current]);
              }
            }}
            className="h-7 text-[11px] px-2.5"
          >
            M-
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              click("action");
              const current = parseFloat(display);
              if (!isNaN(current)) {
                onUpdateMemory([current, ...memory]);
              }
            }}
            className="h-7 text-[11px] px-2.5"
          >
            MS
          </Button>
        </div>

        {lastAnswer !== null && (
          <button
            onClick={handleRecallAns}
            className="text-[11px] font-mono font-semibold text-primary hover:underline px-2 py-0.5 rounded bg-primary/10 border border-primary/20"
          >
            Ans = {lastAnswer}
          </button>
        )}
      </div>

      {/* Keypad Arena: Dual-Deck in Full Screen / Wide Mode, Single-Deck in Compact */}
      {isWideScreen ? (
        <div className="grid grid-cols-8 gap-2 flex-1">
          {/* LEFT DECK: Scientific Functions (4 Columns) */}
          <div className="col-span-4 grid grid-cols-4 gap-2">
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("sin")}>
              sin
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("cos")}>
              cos
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("tan")}>
              tan
            </Button>
            <Button
              variant="action"
              size="keypad"
              onClick={() => handleOperator("pow")}
              className={pendingOp === "pow" ? "operator-active" : ""}
            >
              xʸ
            </Button>

            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("ln")}>
              ln
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("log10")}>
              log
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("exp")}>
              eˣ
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("tenPow")}>
              10ˣ
            </Button>

            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("sqr")}>
              x²
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("cube")}>
              x³
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("sqrt")}>
              √x
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("recip")}>
              ¹/x
            </Button>

            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("fact")}>
              n!
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleUnaryOp("abs")}>
              |x|
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleConstant(Math.PI, "π")}>
              π
            </Button>
            <Button variant="action" size="keypad" onClick={() => handleConstant(Math.E, "e")}>
              e
            </Button>

            <Button
              variant="action"
              size="keypad"
              onClick={() => handleOperator("mod")}
              className={pendingOp === "mod" ? "operator-active" : ""}
            >
              mod
            </Button>
            <Button variant="action" size="keypad" onClick={handleRecallAns} disabled={lastAnswer === null}>
              Ans
            </Button>
            <Button variant="action" size="keypad" onClick={handleToggleSign}>
              ±
            </Button>
            <Button variant="action" size="keypad" onClick={handlePercent}>
              %
            </Button>
          </div>

          {/* RIGHT DECK: Standard Numpad & Core Operators (4 Columns) */}
          <div className="col-span-4 grid grid-cols-4 gap-2">
            <Button variant="action" size="keypad" onClick={handleClearEntry}>
              CE
            </Button>
            <Button variant="action" size="keypad" onClick={handleClear} badge="Esc">
              C
            </Button>
            <Button variant="action" size="keypad" onClick={handleBackspace} badge="⌫">
              <Delete className="size-4" />
            </Button>
            <Button
              variant="operator"
              size="keypad"
              onClick={() => handleOperator("/")}
              className={pendingOp === "/" ? "operator-active" : ""}
            >
              <Divide className="size-5" />
            </Button>

            <Button variant="number" size="keypad" onClick={() => inputDigit("7")}>
              7
            </Button>
            <Button variant="number" size="keypad" onClick={() => inputDigit("8")}>
              8
            </Button>
            <Button variant="number" size="keypad" onClick={() => inputDigit("9")}>
              9
            </Button>
            <Button
              variant="operator"
              size="keypad"
              onClick={() => handleOperator("*")}
              className={pendingOp === "*" ? "operator-active" : ""}
            >
              <X className="size-5" />
            </Button>

            <Button variant="number" size="keypad" onClick={() => inputDigit("4")}>
              4
            </Button>
            <Button variant="number" size="keypad" onClick={() => inputDigit("5")}>
              5
            </Button>
            <Button variant="number" size="keypad" onClick={() => inputDigit("6")}>
              6
            </Button>
            <Button
              variant="operator"
              size="keypad"
              onClick={() => handleOperator("-")}
              className={pendingOp === "-" ? "operator-active" : ""}
            >
              <Minus className="size-5" />
            </Button>

            <Button variant="number" size="keypad" onClick={() => inputDigit("1")}>
              1
            </Button>
            <Button variant="number" size="keypad" onClick={() => inputDigit("2")}>
              2
            </Button>
            <Button variant="number" size="keypad" onClick={() => inputDigit("3")}>
              3
            </Button>
            <Button
              variant="operator"
              size="keypad"
              onClick={() => handleOperator("+")}
              className={pendingOp === "+" ? "operator-active" : ""}
            >
              <Plus className="size-5" />
            </Button>

            <Button variant="number" size="keypad" onClick={() => inputDigit("0")} className="col-span-2">
              0
            </Button>
            <Button variant="number" size="keypad" onClick={inputDecimal}>
              .
            </Button>
            <Button variant="equals" size="keypad" onClick={handleEquals} badge="Enter">
              <Equal className="size-5" />
            </Button>
          </div>
        </div>
      ) : (
        /* COMPACT SINGLE-DECK (4 Columns) */
        <div className="grid grid-cols-4 gap-1.5 flex-1">
          {/* Row 1 */}
          <Button variant="action" size="keypad" onClick={handlePercent}>
            <Percent className="size-4" />
          </Button>
          <Button variant="action" size="keypad" onClick={handleClearEntry}>
            CE
          </Button>
          <Button variant="action" size="keypad" onClick={handleClear} badge="Esc">
            C
          </Button>
          <Button variant="action" size="keypad" onClick={handleBackspace} badge="⌫">
            <Delete className="size-4" />
          </Button>

          {/* Row 2 */}
          <Button variant="action" size="keypad" onClick={() => handleUnaryOp("recip")}>
            ¹/x
          </Button>
          <Button variant="action" size="keypad" onClick={() => handleUnaryOp("sqr")}>
            x²
          </Button>
          <Button variant="action" size="keypad" onClick={() => handleUnaryOp("sqrt")}>
            √x
          </Button>
          <Button
            variant="operator"
            size="keypad"
            onClick={() => handleOperator("/")}
            className={pendingOp === "/" ? "operator-active" : ""}
          >
            <Divide className="size-5" />
          </Button>

          {/* Row 3 */}
          <Button variant="number" size="keypad" onClick={() => inputDigit("7")}>
            7
          </Button>
          <Button variant="number" size="keypad" onClick={() => inputDigit("8")}>
            8
          </Button>
          <Button variant="number" size="keypad" onClick={() => inputDigit("9")}>
            9
          </Button>
          <Button
            variant="operator"
            size="keypad"
            onClick={() => handleOperator("*")}
            className={pendingOp === "*" ? "operator-active" : ""}
          >
            <X className="size-5" />
          </Button>

          {/* Row 4 */}
          <Button variant="number" size="keypad" onClick={() => inputDigit("4")}>
            4
          </Button>
          <Button variant="number" size="keypad" onClick={() => inputDigit("5")}>
            5
          </Button>
          <Button variant="number" size="keypad" onClick={() => inputDigit("6")}>
            6
          </Button>
          <Button
            variant="operator"
            size="keypad"
            onClick={() => handleOperator("-")}
            className={pendingOp === "-" ? "operator-active" : ""}
          >
            <Minus className="size-5" />
          </Button>

          {/* Row 5 */}
          <Button variant="number" size="keypad" onClick={() => inputDigit("1")}>
            1
          </Button>
          <Button variant="number" size="keypad" onClick={() => inputDigit("2")}>
            2
          </Button>
          <Button variant="number" size="keypad" onClick={() => inputDigit("3")}>
            3
          </Button>
          <Button
            variant="operator"
            size="keypad"
            onClick={() => handleOperator("+")}
            className={pendingOp === "+" ? "operator-active" : ""}
          >
            <Plus className="size-5" />
          </Button>

          {/* Row 6 */}
          <Button variant="action" size="keypad" onClick={handleToggleSign}>
            ±
          </Button>
          <Button variant="number" size="keypad" onClick={() => inputDigit("0")}>
            0
          </Button>
          <Button variant="number" size="keypad" onClick={inputDecimal}>
            .
          </Button>
          <Button variant="equals" size="keypad" onClick={handleEquals} badge="Enter">
            <Equal className="size-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
