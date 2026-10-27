import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import {
  formatDisplayNumber,
  sanitizeFloat,
  calculateTrig,
  factorial,
  AngleMode,
} from "@/lib/calculator-engine";
import { playKeyClick } from "@/lib/sound";
import { Delete, Divide, Plus, Minus, X, Equal } from "lucide-react";

interface ScientificCalculatorProps {
  onSaveHistory: (expr: string, res: string) => void;
  angleMode: AngleMode;
  onToggleAngleMode: () => void;
  memory: number[];
  onUpdateMemory: (mem: number[]) => void;
}

export function ScientificCalculator({
  onSaveHistory,
  angleMode,
  onToggleAngleMode,
  memory,
  onUpdateMemory,
}: ScientificCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [is2nd, setIs2nd] = useState(false);

  const click = (type: "number" | "operator" | "equals" | "clear" | "action" = "number") => {
    playKeyClick(type);
  };

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

  const inputDecimal = useCallback(() => {
    click("number");
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand]);

  const handleBackspace = () => {
    click("clear");
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleClear = () => {
    click("clear");
    setDisplay("0");
    setExpression("");
    setPrevValue(null);
    setPendingOp(null);
    setWaitingForOperand(false);
  };

  const handleClearEntry = () => {
    click("clear");
    setDisplay("0");
  };

  const handleConstant = (c: "pi" | "e") => {
    click("number");
    const val = c === "pi" ? Math.PI : Math.E;
    setDisplay(String(val));
    setWaitingForOperand(true);
  };

  const handleTrig = (baseFn: "sin" | "cos" | "tan") => {
    click("operator");
    const fn = is2nd ? (`a${baseFn}` as "asin" | "acos" | "atan") : baseFn;
    const current = parseFloat(display);
    if (isNaN(current)) return;

    const res = calculateTrig(fn, current, angleMode);
    const exprText = `${fn}(${display})`;
    setDisplay(String(res));
    setExpression(exprText);
    setWaitingForOperand(true);
    onSaveHistory(exprText, String(res));
  };

  const handleHyperbolic = (fn: "sinh" | "cosh" | "tanh") => {
    click("operator");
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const res = calculateTrig(fn, current, angleMode);
    const exprText = `${fn}(${display})`;
    setDisplay(String(res));
    setExpression(exprText);
    setWaitingForOperand(true);
    onSaveHistory(exprText, String(res));
  };

  const handleLog = (type: "ln" | "log10") => {
    click("operator");
    const current = parseFloat(display);
    if (isNaN(current) || current <= 0) {
      setDisplay("Invalid Input");
      return;
    }
    const res = type === "ln" ? Math.log(current) : Math.log10(current);
    const sanitized = sanitizeFloat(res);
    const exprText = `${type}(${display})`;
    setDisplay(String(sanitized));
    setExpression(exprText);
    setWaitingForOperand(true);
    onSaveHistory(exprText, String(sanitized));
  };

  const handleScientificUnary = (op: "fact" | "abs" | "sqrt" | "sqr" | "cube" | "recip" | "tenPow" | "expPow") => {
    click("operator");
    const current = parseFloat(display);
    if (isNaN(current)) return;

    let res = current;
    let exprText = "";

    switch (op) {
      case "fact":
        res = factorial(current);
        exprText = `fact(${display})`;
        break;
      case "abs":
        res = Math.abs(current);
        exprText = `abs(${display})`;
        break;
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
      case "tenPow":
        res = sanitizeFloat(Math.pow(10, current));
        exprText = `10^(${display})`;
        break;
      case "expPow":
        res = sanitizeFloat(Math.exp(current));
        exprText = `e^(${display})`;
        break;
    }

    setDisplay(String(res));
    setExpression(exprText);
    setWaitingForOperand(true);
    onSaveHistory(exprText, String(res));
  };

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

  const handleOperator = (nextOp: string) => {
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
    setExpression(`${prevValue !== null && pendingOp && !waitingForOperand ? prevValue : inputValue} ${opSymbol}`);
  };

  const handleEquals = () => {
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
        onSaveHistory(fullExpr, String(result));
      }

      setExpression(fullExpr);
      setPrevValue(null);
      setPendingOp(null);
      setWaitingForOperand(true);
    }
  };

  return (
    <div className="flex flex-col h-full w-full justify-between p-3 gap-2">
      {/* Display Screen */}
      <div className="flex flex-col items-end justify-end px-3 py-2 min-h-[90px] rounded-xl bg-card/60 border border-border/50 shadow-sm backdrop-blur-md">
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground font-mono">
          <span className="text-[10px] font-semibold tracking-wider uppercase bg-muted/60 px-1.5 py-0.5 rounded">
            {angleMode.toUpperCase()}
          </span>
          <span className="truncate max-w-[80%]">{expression}</span>
        </div>
        <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground truncate max-w-full font-mono transition-all">
          {formatDisplayNumber(display)}
        </div>
      </div>

      {/* Mode / Scientific Control Toggles */}
      <div className="flex items-center justify-between gap-1 text-[11px] font-semibold">
        <div className="flex items-center gap-1">
          <Button
            variant="action"
            size="sm"
            onClick={onToggleAngleMode}
            className="h-7 text-[11px] px-2"
          >
            {angleMode === "deg" ? "DEG" : "RAD"}
          </Button>
          <Button
            variant={is2nd ? "default" : "action"}
            size="sm"
            onClick={() => setIs2nd(!is2nd)}
            className="h-7 text-[11px] px-2"
          >
            2ⁿᵈ
          </Button>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            disabled={memory.length === 0}
            onClick={() => onUpdateMemory([])}
            className="h-7 text-[11px] px-1.5"
          >
            MC
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={memory.length === 0}
            onClick={() => {
              if (memory.length > 0) setDisplay(String(memory[0]));
            }}
            className="h-7 text-[11px] px-1.5"
          >
            MR
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const current = parseFloat(display);
              if (!isNaN(current)) onUpdateMemory([current, ...memory]);
            }}
            className="h-7 text-[11px] px-1.5"
          >
            MS
          </Button>
        </div>
      </div>

      {/* Scientific Keypad Grid (5 columns) */}
      <div className="grid grid-cols-5 gap-1.5 flex-1">
        {/* Row 1 */}
        <Button variant="action" size="keypad" onClick={() => handleTrig("sin")}>
          {is2nd ? "sin⁻¹" : "sin"}
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleTrig("cos")}>
          {is2nd ? "cos⁻¹" : "cos"}
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleTrig("tan")}>
          {is2nd ? "tan⁻¹" : "tan"}
        </Button>
        <Button variant="action" size="keypad" onClick={handleClearEntry}>
          CE
        </Button>
        <Button variant="action" size="keypad" onClick={handleClear}>
          C
        </Button>

        {/* Row 2 */}
        <Button variant="action" size="keypad" onClick={() => handleHyperbolic("sinh")}>
          sinh
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleHyperbolic("cosh")}>
          cosh
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleHyperbolic("tanh")}>
          tanh
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleOperator("mod")}>
          mod
        </Button>
        <Button variant="action" size="keypad" onClick={handleBackspace}>
          <Delete className="size-4" />
        </Button>

        {/* Row 3 */}
        <Button variant="action" size="keypad" onClick={() => handleConstant("pi")}>
          π
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleConstant("e")}>
          e
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleScientificUnary("sqr")}>
          x²
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleScientificUnary("sqrt")}>
          √x
        </Button>
        <Button variant="operator" size="keypad" onClick={() => handleOperator("/")}>
          <Divide className="size-4" />
        </Button>

        {/* Row 4 */}
        <Button variant="action" size="keypad" onClick={() => handleScientificUnary("expPow")}>
          eˣ
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleLog("ln")}>
          ln
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

        {/* Row 5 */}
        <Button variant="action" size="keypad" onClick={() => handleScientificUnary("tenPow")}>
          10ˣ
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleLog("log10")}>
          log
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

        {/* Row 6 */}
        <Button variant="action" size="keypad" onClick={() => handleOperator("pow")}>
          xʸ
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleScientificUnary("fact")}>
          n!
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

        {/* Row 7 */}
        <Button variant="action" size="keypad" onClick={() => handleScientificUnary("abs")}>
          |x|
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleScientificUnary("recip")}>
          ¹/x
        </Button>
        <Button
          variant="action"
          size="keypad"
          onClick={() => {
            const num = parseFloat(display);
            if (!isNaN(num)) setDisplay(String(-num));
          }}
        >
          ±
        </Button>
        <Button variant="number" size="keypad" onClick={() => inputDigit("0")}>
          0
        </Button>
        <Button variant="accent" size="keypad" onClick={handleEquals}>
          <Equal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
