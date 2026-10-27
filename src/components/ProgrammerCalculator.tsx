import { useState, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import {
  WordSize,
  WORD_SIZE_BITS,
  formatHex,
  formatDec,
  formatOct,
  formatBin,
  maskBigIntToWordSize,
  getBitAt,
  toggleBitAt,
} from "@/lib/calculator-engine";
import { playKeyClick } from "@/lib/sound";
import { Delete, Divide, Plus, Minus, X, Equal } from "lucide-react";

export type NumberBase = "HEX" | "DEC" | "OCT" | "BIN";

interface ProgrammerCalculatorProps {
  onSaveHistory: (expr: string, res: string) => void;
  wordSize: WordSize;
  onChangeWordSize: (ws: WordSize) => void;
}

export function ProgrammerCalculator({
  onSaveHistory,
  wordSize,
  onChangeWordSize,
}: ProgrammerCalculatorProps) {
  const [currentVal, setCurrentVal] = useState<bigint>(0n);
  const [activeBase, setActiveBase] = useState<NumberBase>("DEC");
  const [expression, setExpression] = useState("");
  const [prevVal, setPrevVal] = useState<bigint | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const click = (type: "number" | "operator" | "equals" | "clear" | "action" = "number") => {
    playKeyClick(type);
  };

  const bitsCount = WORD_SIZE_BITS[wordSize];

  // Formatted representations
  const hexStr = useMemo(() => formatHex(currentVal, wordSize), [currentVal, wordSize]);
  const decStr = useMemo(() => formatDec(currentVal, wordSize), [currentVal, wordSize]);
  const octStr = useMemo(() => formatOct(currentVal, wordSize), [currentVal, wordSize]);
  const binStr = useMemo(() => formatBin(currentVal, wordSize), [currentVal, wordSize]);

  // Main display value based on selected base
  const primaryDisplay = useMemo(() => {
    switch (activeBase) {
      case "HEX":
        return hexStr;
      case "DEC":
        return decStr;
      case "OCT":
        return octStr;
      case "BIN":
        return binStr.replace(/\s/g, "");
    }
  }, [activeBase, hexStr, decStr, octStr, binStr]);

  // Input a character (0-9, A-F) in the current base
  const inputChar = useCallback(
    (char: string) => {
      click("number");
      let baseRadix = 10;
      if (activeBase === "HEX") baseRadix = 16;
      else if (activeBase === "OCT") baseRadix = 8;
      else if (activeBase === "BIN") baseRadix = 2;

      let currentStr = "";
      if (waitingForOperand) {
        currentStr = char;
        setWaitingForOperand(false);
      } else {
        if (activeBase === "HEX") currentStr = currentVal.toString(16) + char;
        else if (activeBase === "OCT") currentStr = currentVal.toString(8) + char;
        else if (activeBase === "BIN") currentStr = currentVal.toString(2) + char;
        else currentStr = currentVal.toString(10) + char;
      }

      try {
        const parsed = BigInt(
          baseRadix === 16 ? "0x" + currentStr : baseRadix === 8 ? "0o" + currentStr : baseRadix === 2 ? "0b" + currentStr : currentStr
        );
        setCurrentVal(maskBigIntToWordSize(parsed, wordSize));
      } catch {
        // invalid parsing, ignore
      }
    },
    [activeBase, currentVal, waitingForOperand, wordSize]
  );

  const handleBackspace = () => {
    click("clear");
    if (waitingForOperand) return;
    let baseRadix = 10;
    if (activeBase === "HEX") baseRadix = 16;
    else if (activeBase === "OCT") baseRadix = 8;
    else if (activeBase === "BIN") baseRadix = 2;

    const currentStr = currentVal.toString(baseRadix);
    if (currentStr.length > 1) {
      const sliced = currentStr.slice(0, -1);
      const parsed = BigInt(
        baseRadix === 16 ? "0x" + sliced : baseRadix === 8 ? "0o" + sliced : baseRadix === 2 ? "0b" + sliced : sliced
      );
      setCurrentVal(maskBigIntToWordSize(parsed, wordSize));
    } else {
      setCurrentVal(0n);
    }
  };

  const handleClear = () => {
    click("clear");
    setCurrentVal(0n);
    setPrevVal(null);
    setPendingOp(null);
    setExpression("");
    setWaitingForOperand(false);
  };

  const handleBitwiseUnary = (op: "NOT" | "Lsh" | "Rsh" | "Rol" | "Ror") => {
    click("operator");
    let res = currentVal;
    const bits = BigInt(bitsCount);

    switch (op) {
      case "NOT":
        res = ~currentVal;
        break;
      case "Lsh":
        res = currentVal << 1n;
        break;
      case "Rsh":
        res = currentVal >> 1n;
        break;
      case "Rol": {
        const highBit = (currentVal >> (bits - 1n)) & 1n;
        res = (currentVal << 1n) | highBit;
        break;
      }
      case "Ror": {
        const lowBit = currentVal & 1n;
        res = (currentVal >> 1n) | (lowBit << (bits - 1n));
        break;
      }
    }

    const masked = maskBigIntToWordSize(res, wordSize);
    const exprText = `${op}(${formatDec(currentVal, wordSize)})`;
    setCurrentVal(masked);
    setExpression(exprText);
    setWaitingForOperand(true);
    onSaveHistory(exprText, formatDec(masked, wordSize));
  };

  const executeBigIntOp = (a: bigint, b: bigint, op: string): bigint => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0n ? 0n : a / b;
      case "%":
        return b === 0n ? 0n : a % b;
      case "AND":
        return a & b;
      case "OR":
        return a | b;
      case "XOR":
        return a ^ b;
      case "NAND":
        return ~(a & b);
      case "NOR":
        return ~(a | b);
      default:
        return b;
    }
  };

  const handleBinaryOp = (op: string) => {
    click("operator");
    if (prevVal === null) {
      setPrevVal(currentVal);
    } else if (pendingOp && !waitingForOperand) {
      const res = executeBigIntOp(prevVal, currentVal, pendingOp);
      const masked = maskBigIntToWordSize(res, wordSize);
      setCurrentVal(masked);
      setPrevVal(masked);
    }

    setWaitingForOperand(true);
    setPendingOp(op);
    setExpression(`${formatDec(currentVal, wordSize)} ${op}`);
  };

  const handleEquals = () => {
    click("equals");
    if (prevVal !== null && pendingOp) {
      const res = executeBigIntOp(prevVal, currentVal, pendingOp);
      const masked = maskBigIntToWordSize(res, wordSize);
      const fullExpr = `${formatDec(prevVal, wordSize)} ${pendingOp} ${formatDec(currentVal, wordSize)} =`;

      setCurrentVal(masked);
      setExpression(fullExpr);
      setPrevVal(null);
      setPendingOp(null);
      setWaitingForOperand(true);
      onSaveHistory(fullExpr, formatDec(masked, wordSize));
    }
  };

  // Check if a keypad button is valid in active base
  const isKeyValid = (key: string): boolean => {
    if (activeBase === "BIN") {
      return key === "0" || key === "1";
    }
    if (activeBase === "OCT") {
      return key >= "0" && key <= "7";
    }
    if (activeBase === "DEC") {
      return key >= "0" && key <= "9";
    }
    // HEX
    return (key >= "0" && key <= "9") || (key >= "A" && key <= "F");
  };

  const wordSizes: WordSize[] = ["QWORD", "DWORD", "WORD", "BYTE"];

  return (
    <div className="flex flex-col h-full w-full justify-between p-3 gap-2">
      {/* Primary Display */}
      <div className="flex flex-col items-end justify-end px-3 py-2 min-h-[70px] rounded-xl bg-card/60 border border-border/50 shadow-sm backdrop-blur-md">
        <div className="h-4 text-[11px] text-muted-foreground font-mono truncate max-w-full">
          {expression}
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate max-w-full font-mono">
          {primaryDisplay}
        </div>
      </div>

      {/* Real-time Base Selectors (HEX, DEC, OCT, BIN) */}
      <div className="flex flex-col gap-1 rounded-xl bg-muted/30 p-1.5 border border-border/40 text-xs font-mono">
        <button
          onClick={() => setActiveBase("HEX")}
          className={`flex items-center justify-between px-2 py-1 rounded-md transition-colors ${
            activeBase === "HEX" ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted text-muted-foreground"
          }`}
        >
          <span className="w-8 font-semibold">HEX</span>
          <span className="truncate">{hexStr}</span>
        </button>
        <button
          onClick={() => setActiveBase("DEC")}
          className={`flex items-center justify-between px-2 py-1 rounded-md transition-colors ${
            activeBase === "DEC" ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted text-muted-foreground"
          }`}
        >
          <span className="w-8 font-semibold">DEC</span>
          <span className="truncate">{decStr}</span>
        </button>
        <button
          onClick={() => setActiveBase("OCT")}
          className={`flex items-center justify-between px-2 py-1 rounded-md transition-colors ${
            activeBase === "OCT" ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted text-muted-foreground"
          }`}
        >
          <span className="w-8 font-semibold">OCT</span>
          <span className="truncate">{octStr}</span>
        </button>
        <button
          onClick={() => setActiveBase("BIN")}
          className={`flex items-center justify-between px-2 py-1 rounded-md transition-colors ${
            activeBase === "BIN" ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted text-muted-foreground"
          }`}
        >
          <span className="w-8 font-semibold">BIN</span>
          <span className="truncate text-[10px] tracking-wider">{binStr}</span>
        </button>
      </div>

      {/* Word Size & Bit Toggler Controls */}
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/40">
          {wordSizes.map((ws) => (
            <button
              key={ws}
              onClick={() => onChangeWordSize(ws)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                wordSize === ws
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ws}
            </button>
          ))}
        </div>

        {/* Quick Bit Toggler bar (shows last 8 or 16 bits interactively) */}
        <div className="flex items-center gap-0.5 font-mono text-[9px]">
          {Array.from({ length: Math.min(bitsCount, 16) }).map((_, idx) => {
            const bitIndex = Math.min(bitsCount, 16) - 1 - idx;
            const bitVal = getBitAt(currentVal, bitIndex);
            return (
              <button
                key={bitIndex}
                onClick={() => {
                  click("operator");
                  setCurrentVal(toggleBitAt(currentVal, bitIndex, wordSize));
                }}
                className={`h-5 w-4 rounded-xs border text-center transition-colors ${
                  bitVal === 1
                    ? "bg-primary text-primary-foreground border-primary font-bold"
                    : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted"
                }`}
                title={`Bit ${bitIndex}: click to flip`}
              >
                {bitVal}
              </button>
            );
          })}
        </div>
      </div>

      {/* Programmer Keypad Grid */}
      <div className="grid grid-cols-5 gap-1.5 flex-1">
        {/* Row 1: Bitwise */}
        <Button variant="action" size="keypad" onClick={() => handleBinaryOp("AND")}>
          AND
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBinaryOp("OR")}>
          OR
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("NOT")}>
          NOT
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBinaryOp("XOR")}>
          XOR
        </Button>
        <Button variant="action" size="keypad" onClick={handleClear}>
          C
        </Button>

        {/* Row 2: Shifts */}
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("Lsh")}>
          Lsh
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("Rsh")}>
          Rsh
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("Rol")}>
          Rol
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("Ror")}>
          Ror
        </Button>
        <Button variant="action" size="keypad" onClick={handleBackspace}>
          <Delete className="size-4" />
        </Button>

        {/* Row 3: Hex A-B & 7-9 */}
        <Button
          variant="action"
          size="keypad"
          disabled={!isKeyValid("A")}
          onClick={() => inputChar("A")}
        >
          A
        </Button>
        <Button
          variant="action"
          size="keypad"
          disabled={!isKeyValid("B")}
          onClick={() => inputChar("B")}
        >
          B
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("7")}
          onClick={() => inputChar("7")}
        >
          7
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("8")}
          onClick={() => inputChar("8")}
        >
          8
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("9")}
          onClick={() => inputChar("9")}
        >
          9
        </Button>

        {/* Row 4: Hex C-D & 4-6 */}
        <Button
          variant="action"
          size="keypad"
          disabled={!isKeyValid("C")}
          onClick={() => inputChar("C")}
        >
          C
        </Button>
        <Button
          variant="action"
          size="keypad"
          disabled={!isKeyValid("D")}
          onClick={() => inputChar("D")}
        >
          D
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("4")}
          onClick={() => inputChar("4")}
        >
          4
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("5")}
          onClick={() => inputChar("5")}
        >
          5
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("6")}
          onClick={() => inputChar("6")}
        >
          6
        </Button>

        {/* Row 5: Hex E-F & 1-3 */}
        <Button
          variant="action"
          size="keypad"
          disabled={!isKeyValid("E")}
          onClick={() => inputChar("E")}
        >
          E
        </Button>
        <Button
          variant="action"
          size="keypad"
          disabled={!isKeyValid("F")}
          onClick={() => inputChar("F")}
        >
          F
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("1")}
          onClick={() => inputChar("1")}
        >
          1
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("2")}
          onClick={() => inputChar("2")}
        >
          2
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("3")}
          onClick={() => inputChar("3")}
        >
          3
        </Button>

        {/* Row 6: Arithmetic & Zero */}
        <Button variant="operator" size="keypad" onClick={() => handleBinaryOp("+")}>
          <Plus className="size-4" />
        </Button>
        <Button variant="operator" size="keypad" onClick={() => handleBinaryOp("-")}>
          <Minus className="size-4" />
        </Button>
        <Button variant="operator" size="keypad" onClick={() => handleBinaryOp("*")}>
          <X className="size-4" />
        </Button>
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("0")}
          onClick={() => inputChar("0")}
        >
          0
        </Button>
        <Button variant="accent" size="keypad" onClick={handleEquals}>
          <Equal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
