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
import { Delete, Divide, Plus, Minus, X, Equal, Copy, Check } from "lucide-react";

export type NumberBase = "HEX" | "DEC" | "OCT" | "BIN";

interface ProgrammerCalculatorProps {
  onSaveHistory: (expr: string, res: string) => void;
  wordSize: WordSize;
  onChangeWordSize: (ws: WordSize) => void;
  isWideScreen?: boolean;
  onDisplayChange?: (val: string) => void;
}

export function ProgrammerCalculator({
  onSaveHistory,
  wordSize,
  onChangeWordSize,
  isWideScreen = false,
  onDisplayChange,
}: ProgrammerCalculatorProps) {
  const [currentVal, setCurrentVal] = useState<bigint>(0n);
  const [activeBase, setActiveBase] = useState<NumberBase>("DEC");
  const [expression, setExpression] = useState("");
  const [prevVal, setPrevVal] = useState<bigint | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [copied, setCopied] = useState(false);

  const click = (type: "number" | "operator" | "equals" | "clear" | "action" = "number") => {
    playKeyClick(type);
  };

  const bitsCount = WORD_SIZE_BITS[wordSize];

  // Formatted representations
  const hexStr = useMemo(() => formatHex(currentVal, wordSize), [currentVal, wordSize]);
  const decStr = useMemo(() => formatDec(currentVal, wordSize), [currentVal, wordSize]);
  const octStr = useMemo(() => formatOct(currentVal, wordSize), [currentVal, wordSize]);
  const binStr = useMemo(() => formatBin(currentVal, wordSize), [currentVal, wordSize]);

  // Primary display string
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

  // Sync to parent
  useMemo(() => {
    if (onDisplayChange) {
      onDisplayChange(decStr);
    }
  }, [decStr, onDisplayChange]);

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
          baseRadix === 16
            ? "0x" + currentStr
            : baseRadix === 8
            ? "0o" + currentStr
            : baseRadix === 2
            ? "0b" + currentStr
            : currentStr
        );
        setCurrentVal(maskBigIntToWordSize(parsed, wordSize));
      } catch {}
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
        baseRadix === 16
          ? "0x" + sliced
          : baseRadix === 8
          ? "0o" + sliced
          : baseRadix === 2
          ? "0b" + sliced
          : sliced
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

  const isKeyValid = (key: string): boolean => {
    if (activeBase === "BIN") return key === "0" || key === "1";
    if (activeBase === "OCT") return key >= "0" && key <= "7";
    if (activeBase === "DEC") return key >= "0" && key <= "9";
    return (key >= "0" && key <= "9") || (key >= "A" && key <= "F");
  };

  const wordSizes: WordSize[] = ["QWORD", "DWORD", "WORD", "BYTE"];

  return (
    <div className="flex flex-col h-full w-full justify-between p-3 sm:p-5 gap-3 max-w-5xl mx-auto">
      {/* Display Card */}
      <div className="flex flex-col items-end justify-end px-4 py-3 min-h-[90px] sm:min-h-[105px] rounded-2xl bg-card/70 border border-border/60 shadow-lg backdrop-blur-2xl relative overflow-hidden group">
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground font-mono">
          <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
            {activeBase} • {wordSize}
          </span>
          <span className="truncate max-w-[70%]">{expression}</span>
        </div>
        <div className="w-full flex items-center justify-between mt-1">
          <button
            onClick={() => {
              click("action");
              navigator.clipboard.writeText(primaryDisplay);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60"
            title="Copy value"
          >
            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          </button>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground truncate font-mono text-right">
            {primaryDisplay}
          </div>
        </div>
      </div>

      {/* Real-time Base Selector Bar (HEX, DEC, OCT, BIN) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-card/40 p-2 border border-border/40 text-xs font-mono backdrop-blur-md">
        {(["HEX", "DEC", "OCT", "BIN"] as NumberBase[]).map((base) => {
          const val =
            base === "HEX" ? hexStr : base === "DEC" ? decStr : base === "OCT" ? octStr : binStr;
          return (
            <button
              key={base}
              onClick={() => {
                click("action");
                setActiveBase(base);
              }}
              className={`flex flex-col p-2 rounded-lg text-left transition-all border ${
                activeBase === base
                  ? "bg-primary/15 border-primary/50 shadow-xs"
                  : "bg-muted/20 border-transparent hover:bg-muted/50"
              }`}
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{base}</span>
              <span className="text-sm font-bold text-foreground truncate mt-0.5">{val}</span>
            </button>
          );
        })}
      </div>

      {/* Word Size & 64-Bit Interactive Toggler (Expanded for Pro Studio) */}
      <div className="flex flex-col gap-2 rounded-xl bg-card/40 p-3 border border-border/40 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/40">
            {wordSizes.map((ws) => (
              <button
                key={ws}
                onClick={() => {
                  click("action");
                  onChangeWordSize(ws);
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  wordSize === ws
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ws}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-muted-foreground">
            {bitsCount} BITS (CLICK TO FLIP)
          </span>
        </div>

        {/* 64-Bit Interactive Bit Matrix (4 rows of 16 bits in wide mode) */}
        <div className="grid grid-cols-16 gap-1 font-mono text-[9px] pt-1">
          {Array.from({ length: bitsCount }).map((_, idx) => {
            const bitIndex = bitsCount - 1 - idx;
            const bitVal = getBitAt(currentVal, bitIndex);
            return (
              <button
                key={bitIndex}
                onClick={() => {
                  click("operator");
                  setCurrentVal(toggleBitAt(currentVal, bitIndex, wordSize));
                }}
                className={`h-6 rounded-md border flex flex-col items-center justify-center transition-all ${
                  bitVal === 1
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted"
                }`}
                title={`Bit ${bitIndex}`}
              >
                <span>{bitVal}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Programmer Keypad Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-6 gap-2 flex-1">
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
        <Button variant="action" size="keypad" onClick={handleClear} badge="Esc">
          C
        </Button>
        <Button variant="action" size="keypad" onClick={handleBackspace} badge="⌫">
          <Delete className="size-4" />
        </Button>

        {/* Row 2: Shifts & Hex A-B */}
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("Lsh")}>
          Lsh
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("Rsh")}>
          Rsh
        </Button>
        <Button variant="action" size="keypad" disabled={!isKeyValid("A")} onClick={() => inputChar("A")}>
          A
        </Button>
        <Button variant="action" size="keypad" disabled={!isKeyValid("B")} onClick={() => inputChar("B")} >
          B
        </Button>
        <Button variant="number" size="keypad" disabled={!isKeyValid("7")} onClick={() => inputChar("7")}>
          7
        </Button>
        <Button variant="number" size="keypad" disabled={!isKeyValid("8")} onClick={() => inputChar("8")}>
          8
        </Button>

        {/* Row 3: Hex C-D & 9, 4-6 */}
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("Rol")}>
          Rol
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBitwiseUnary("Ror")}>
          Ror
        </Button>
        <Button variant="action" size="keypad" disabled={!isKeyValid("C")} onClick={() => inputChar("C")}>
          C
        </Button>
        <Button variant="action" size="keypad" disabled={!isKeyValid("D")} onClick={() => inputChar("D")}>
          D
        </Button>
        <Button variant="number" size="keypad" disabled={!isKeyValid("9")} onClick={() => inputChar("9")}>
          9
        </Button>
        <Button variant="operator" size="keypad" onClick={() => handleBinaryOp("/")}>
          <Divide className="size-5" />
        </Button>

        {/* Row 4: Hex E-F & 4-6, Multiply */}
        <Button variant="action" size="keypad" onClick={() => handleBinaryOp("NAND")}>
          NAND
        </Button>
        <Button variant="action" size="keypad" onClick={() => handleBinaryOp("NOR")}>
          NOR
        </Button>
        <Button variant="action" size="keypad" disabled={!isKeyValid("E")} onClick={() => inputChar("E")}>
          E
        </Button>
        <Button variant="action" size="keypad" disabled={!isKeyValid("F")} onClick={() => inputChar("F")}>
          F
        </Button>
        <Button variant="number" size="keypad" disabled={!isKeyValid("4")} onClick={() => inputChar("4")}>
          4
        </Button>
        <Button variant="number" size="keypad" disabled={!isKeyValid("5")} onClick={() => inputChar("5")}>
          5
        </Button>

        {/* Row 5: 6, 1-3, Subtract, Add */}
        <Button variant="number" size="keypad" disabled={!isKeyValid("6")} onClick={() => inputChar("6")}>
          6
        </Button>
        <Button variant="operator" size="keypad" onClick={() => handleBinaryOp("*")}>
          <X className="size-5" />
        </Button>
        <Button variant="number" size="keypad" disabled={!isKeyValid("1")} onClick={() => inputChar("1")}>
          1
        </Button>
        <Button variant="number" size="keypad" disabled={!isKeyValid("2")} onClick={() => inputChar("2")}>
          2
        </Button>
        <Button variant="number" size="keypad" disabled={!isKeyValid("3")} onClick={() => inputChar("3")}>
          3
        </Button>
        <Button variant="operator" size="keypad" onClick={() => handleBinaryOp("-")}>
          <Minus className="size-5" />
        </Button>

        {/* Row 6: Zero & Operators & Equals */}
        <Button
          variant="number"
          size="keypad"
          disabled={!isKeyValid("0")}
          onClick={() => inputChar("0")}
          className="col-span-2"
        >
          0
        </Button>
        <Button variant="operator" size="keypad" onClick={() => handleBinaryOp("+")} className="col-span-2">
          <Plus className="size-5" />
        </Button>
        <Button variant="equals" size="keypad" onClick={handleEquals} className="col-span-2" badge="Enter">
          <Equal className="size-5" />
        </Button>
      </div>
    </div>
  );
}
