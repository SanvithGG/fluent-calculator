import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { formatDisplayNumber, sanitizeFloat } from "@/lib/calculator-engine";
import { playKeyClick } from "@/lib/sound";
import { Delete, Divide, Plus, Minus, X, Equal, Percent } from "lucide-react";

interface StandardCalculatorProps {
  onSaveHistory: (expr: string, res: string) => void;
  memory: number[];
  onUpdateMemory: (mem: number[]) => void;
}

export function StandardCalculator({
  onSaveHistory,
  memory,
  onUpdateMemory,
}: StandardCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // Sound wrapper
  const click = (type: "number" | "operator" | "equals" | "clear" | "action" = "number") => {
    playKeyClick(type);
  };

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

  // Clear Entry / All Clear
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

  // Invert Sign
  const handleToggleSign = useCallback(() => {
    click("operator");
    const num = parseFloat(display);
    if (!isNaN(num) && num !== 0) {
      setDisplay(String(-num));
    }
  }, [display]);

  // Unary operations (sqrt, square, reciprocal)
  const handleUnary = useCallback(
    (op: "sqrt" | "sqr" | "recip") => {
      click("operator");
      const current = parseFloat(display);
      if (isNaN(current)) return;

      let res = current;
      let exprText = "";

      if (op === "sqrt") {
        if (current < 0) {
          setDisplay("Error");
          return;
        }
        res = sanitizeFloat(Math.sqrt(current));
        exprText = `√(${display})`;
      } else if (op === "sqr") {
        res = sanitizeFloat(current * current);
        exprText = `sqr(${display})`;
      } else if (op === "recip") {
        if (current === 0) {
          setDisplay("Cannot divide by zero");
          return;
        }
        res = sanitizeFloat(1 / current);
        exprText = `1/(${display})`;
      }

      setDisplay(String(res));
      setExpression(exprText);
      setWaitingForOperand(true);
      onSaveHistory(exprText, String(res));
    },
    [display, onSaveHistory]
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

  // Perform binary calculation
  const executeOperation = (
    first: number,
    second: number,
    op: string
  ): number => {
    switch (op) {
      case "+":
        return sanitizeFloat(first + second);
      case "-":
        return sanitizeFloat(first - second);
      case "*":
        return sanitizeFloat(first * second);
      case "/":
        return second === 0 ? NaN : sanitizeFloat(first / second);
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

      const opSymbol =
        nextOp === "*" ? "×" : nextOp === "/" ? "÷" : nextOp;
      setExpression(`${prevValue !== null && pendingOp && !waitingForOperand ? prevValue : inputValue} ${opSymbol}`);
    },
    [display, prevValue, pendingOp, waitingForOperand]
  );

  // Equals (=)
  const handleEquals = useCallback(() => {
    click("equals");
    const current = parseFloat(display);

    if (prevValue !== null && pendingOp) {
      const result = executeOperation(prevValue, current, pendingOp);
      const opSymbol =
        pendingOp === "*" ? "×" : pendingOp === "/" ? "÷" : pendingOp;
      const fullExpr = `${prevValue} ${opSymbol} ${current} =`;

      if (isNaN(result)) {
        setDisplay("Error");
      } else {
        setDisplay(String(result));
        onSaveHistory(fullExpr, String(result));
      }

      setExpression(fullExpr);
      setPrevValue(null);
      setPendingOp(null);
      setWaitingForOperand(true);
    }
  }, [display, prevValue, pendingOp, onSaveHistory]);

  // Memory functions
  const handleMemoryStore = () => {
    click("action");
    const current = parseFloat(display);
    if (!isNaN(current)) {
      onUpdateMemory([current, ...memory]);
    }
  };

  const handleMemoryClear = () => {
    click("clear");
    onUpdateMemory([]);
  };

  const handleMemoryRecall = () => {
    click("action");
    if (memory.length > 0) {
      setDisplay(String(memory[0]));
      setWaitingForOperand(true);
    }
  };

  const handleMemoryAdd = () => {
    click("action");
    const current = parseFloat(display);
    if (!isNaN(current) && memory.length > 0) {
      const updated = [...memory];
      updated[0] = sanitizeFloat(updated[0] + current);
      onUpdateMemory(updated);
    } else if (!isNaN(current)) {
      onUpdateMemory([current]);
    }
  };

  const handleMemorySubtract = () => {
    click("action");
    const current = parseFloat(display);
    if (!isNaN(current) && memory.length > 0) {
      const updated = [...memory];
      updated[0] = sanitizeFloat(updated[0] - current);
      onUpdateMemory(updated);
    } else if (!isNaN(current)) {
      onUpdateMemory([-current]);
    }
  };

  // Keyboard shortcut listener
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
    <div className="flex flex-col h-full w-full justify-between p-3 gap-2">
      {/* Display Screen */}
      <div className="flex flex-col items-end justify-end px-3 py-2 min-h-[90px] rounded-xl bg-card/60 border border-border/50 shadow-sm backdrop-blur-md">
        <div className="h-5 text-xs text-muted-foreground font-mono truncate max-w-full">
          {expression}
        </div>
        <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground truncate max-w-full font-mono transition-all">
          {formatDisplayNumber(display)}
        </div>
      </div>

      {/* Memory Bar */}
      <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasMemory}
          onClick={handleMemoryClear}
          className="h-7 text-[11px]"
        >
          MC
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasMemory}
          onClick={handleMemoryRecall}
          className="h-7 text-[11px]"
        >
          MR
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMemoryAdd}
          className="h-7 text-[11px]"
        >
          M+
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMemorySubtract}
          className="h-7 text-[11px]"
        >
          M-
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMemoryStore}
          className="h-7 text-[11px]"
        >
          MS
        </Button>
      </div>

      {/* Keypad Grid (4 columns) */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {/* Row 1 */}
        <Button variant="action" size="keypad" onClick={handlePercent}>
          <Percent className="size-4" />
        </Button>
        <Button variant="action" size="keypad" onClick={handleClearEntry}>
          CE
        </Button>
        <Button variant="action" size="keypad" onClick={handleClear}>
          C
        </Button>
        <Button variant="action" size="keypad" onClick={handleBackspace}>
          <Delete className="size-4" />
        </Button>

        {/* Row 2 */}
        <Button variant="action" size="keypad" onClick={() => handleUnary("recip")}>
          ¹/x
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleUnary("sqr")}>
          x²
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleUnary("sqrt")}>
          √x
        </Button>
        <Button variant="operator" size="keypad" onClick={() => handleOperator("/")}>
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
        <Button variant="operator" size="keypad" onClick={() => handleOperator("*")}>
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
        <Button variant="operator" size="keypad" onClick={() => handleOperator("-")}>
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
        <Button variant="operator" size="keypad" onClick={() => handleOperator("+")}>
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
        <Button variant="accent" size="keypad" onClick={handleEquals}>
          <Equal className="size-5" />
        </Button>
      </div>
    </div>
  );
}
