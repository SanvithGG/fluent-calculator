// Robust mathematical computation engine

export type AngleMode = "deg" | "rad";
export type WordSize = "QWORD" | "DWORD" | "WORD" | "BYTE";

// Maximum bits per word size
export const WORD_SIZE_BITS: Record<WordSize, number> = {
  QWORD: 64,
  DWORD: 32,
  WORD: 16,
  BYTE: 8,
};

// Formats number to readable localized string with max precision
export function formatDisplayNumber(val: number | string): string {
  if (val === "" || val === undefined || val === null) return "0";
  const str = String(val);

  if (str === "Error" || str === "NaN" || str === "Infinity" || str === "-Infinity") {
    return str;
  }

  // Handle trailing dot or decimals during typing
  if (str.endsWith(".")) {
    const intPart = str.slice(0, -1);
    const num = Number(intPart);
    if (!isNaN(num)) {
      return num.toLocaleString("en-US") + ".";
    }
    return str;
  }

  if (str.includes(".")) {
    const [intPart, decPart] = str.split(".");
    const num = Number(intPart);
    if (!isNaN(num)) {
      return num.toLocaleString("en-US") + "." + decPart;
    }
    return str;
  }

  const num = Number(str);
  if (isNaN(num)) return str;

  // For very large numbers use scientific notation
  if (Math.abs(num) >= 1e16 || (Math.abs(num) > 0 && Math.abs(num) < 1e-7)) {
    return num.toExponential(8).replace(/\.?0+e/, "e");
  }

  return num.toLocaleString("en-US", { maximumFractionDigits: 12 });
}

// Factorial calculation
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // overflow for 64-bit float
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Clean floating point rounding errors (e.g. 0.1 + 0.2 => 0.3)
export function sanitizeFloat(num: number): number {
  if (!Number.isFinite(num)) return num;
  return parseFloat(num.toPrecision(14));
}

// Trig helpers with DEG/RAD support
export function calculateTrig(
  fn: string,
  val: number,
  angleMode: AngleMode
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const rad = angleMode === "deg" ? toRad(val) : val;

  switch (fn) {
    case "sin": {
      // Fix sin(180) = 0 instead of 1.22e-16
      if (angleMode === "deg" && val % 180 === 0) return 0;
      return sanitizeFloat(Math.sin(rad));
    }
    case "cos": {
      if (angleMode === "deg" && (val - 90) % 180 === 0) return 0;
      return sanitizeFloat(Math.cos(rad));
    }
    case "tan": {
      if (angleMode === "deg" && (val - 90) % 180 === 0) return NaN;
      return sanitizeFloat(Math.tan(rad));
    }
    case "asin": {
      const res = Math.asin(val);
      return angleMode === "deg" ? sanitizeFloat(toDeg(res)) : sanitizeFloat(res);
    }
    case "acos": {
      const res = Math.acos(val);
      return angleMode === "deg" ? sanitizeFloat(toDeg(res)) : sanitizeFloat(res);
    }
    case "atan": {
      const res = Math.atan(val);
      return angleMode === "deg" ? sanitizeFloat(toDeg(res)) : sanitizeFloat(res);
    }
    case "sinh":
      return sanitizeFloat(Math.sinh(val));
    case "cosh":
      return sanitizeFloat(Math.cosh(val));
    case "tanh":
      return sanitizeFloat(Math.tanh(val));
    default:
      return val;
  }
}

// Programmer Mode Helpers (64-bit BigInt math)
export function maskBigIntToWordSize(val: bigint, wordSize: WordSize): bigint {
  const bits = BigInt(WORD_SIZE_BITS[wordSize]);
  const mask = (1n << bits) - 1n;
  return val & mask;
}

export function formatHex(val: bigint, wordSize: WordSize): string {
  const hex = maskBigIntToWordSize(val, wordSize).toString(16).toUpperCase();
  return hex || "0";
}

export function formatDec(val: bigint, wordSize: WordSize): string {
  const masked = maskBigIntToWordSize(val, wordSize);
  const bits = WORD_SIZE_BITS[wordSize];
  // Check if sign bit is set for signed display
  const signBit = 1n << BigInt(bits - 1);
  if ((masked & signBit) !== 0n) {
    // Negative two's complement
    const maxVal = 1n << BigInt(bits);
    return (masked - maxVal).toString(10);
  }
  return masked.toString(10);
}

export function formatOct(val: bigint, wordSize: WordSize): string {
  return maskBigIntToWordSize(val, wordSize).toString(8);
}

export function formatBin(val: bigint, wordSize: WordSize): string {
  const bits = WORD_SIZE_BITS[wordSize];
  const masked = maskBigIntToWordSize(val, wordSize);
  let bin = masked.toString(2);
  // Pad with leading zeros to full word size
  bin = bin.padStart(bits, "0");
  // Group in 4-bit nibbles separated by spaces
  return bin.match(/.{1,4}/g)?.join(" ") || bin;
}

export function getBitAt(val: bigint, bitIndex: number): number {
  return Number((val >> BigInt(bitIndex)) & 1n);
}

export function toggleBitAt(val: bigint, bitIndex: number, wordSize: WordSize): bigint {
  const toggled = val ^ (1n << BigInt(bitIndex));
  return maskBigIntToWordSize(toggled, wordSize);
}
