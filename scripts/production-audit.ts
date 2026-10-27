/**
 * Fluent Calculator - Comprehensive Production & Bug Guideline Audit Suite
 */
import {
  formatDisplayNumber,
  factorial,
  sanitizeFloat,
  calculateTrig,
  maskBigIntToWordSize,
  formatHex,
  formatDec,
  formatBin,
  toggleBitAt,
  WORD_SIZE_BITS,
} from "../src/lib/calculator-engine";
import { convertUnits, UNIT_CATEGORIES } from "../src/lib/converters";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

console.log("\n=======================================================");
console.log(" 🧪 Fluent Calculator - Production Bug Audit Suite");
console.log("=======================================================\n");

// 1. Arithmetic & Floating Point Sanitation
console.log("--- 1. Math Engine Precision & Sanitation ---");
assert(sanitizeFloat(0.1 + 0.2) === 0.3, "Floating-point: 0.1 + 0.2 sanitized to 0.3");
assert(sanitizeFloat(1.0000000000000002) === 1, "Floating-point precision rounding");
assert(formatDisplayNumber(0) === "0", "Format: 0 displays as '0'");
assert(formatDisplayNumber(1234567) === "1,234,567", "Format: thousands separator");
assert(formatDisplayNumber("123.") === "123.", "Format: trailing dot preserved during typing");
assert(formatDisplayNumber("0.05") === "0.05", "Format: leading decimals");
assert(formatDisplayNumber(1e18).includes("e+18") || formatDisplayNumber(1e18).includes("e18"), "Format: large scientific notation");
assert(formatDisplayNumber("Infinity") === "Infinity", "Format: Infinity preserved without crash");
assert(formatDisplayNumber("Error") === "Error", "Format: Error preserved without crash");

// 2. Factorials
console.log("\n--- 2. Factorial Edge Cases ---");
assert(factorial(0) === 1, "0! = 1");
assert(factorial(1) === 1, "1! = 1");
assert(factorial(5) === 120, "5! = 120");
assert(factorial(10) === 3628800, "10! = 3,628,800");
assert(Number.isFinite(factorial(170)), "170! is finite IEEE 754 float");
assert(factorial(171) === Infinity, "171! gracefully overflows to Infinity");
assert(isNaN(factorial(-5)), "Negative factorial returns NaN");
assert(isNaN(factorial(3.5)), "Float factorial returns NaN");

// 3. Trigonometric Functions & Angle Modes
console.log("\n--- 3. Trigonometric Engine (DEG / RAD) ---");
assert(calculateTrig("sin", 0, "deg") === 0, "sin(0°) = 0");
assert(calculateTrig("sin", 90, "deg") === 1, "sin(90°) = 1");
assert(calculateTrig("sin", 180, "deg") === 0, "sin(180°) = 0 (exact zero check)");
assert(calculateTrig("sin", 270, "deg") === -1, "sin(270°) = -1");
assert(calculateTrig("cos", 0, "deg") === 1, "cos(0°) = 1");
assert(calculateTrig("cos", 90, "deg") === 0, "cos(90°) = 0 (exact zero check)");
assert(calculateTrig("cos", 180, "deg") === -1, "cos(180°) = -1");
assert(calculateTrig("tan", 0, "deg") === 0, "tan(0°) = 0");
assert(calculateTrig("tan", 45, "deg") === 1, "tan(45°) = 1");
assert(isNaN(calculateTrig("tan", 90, "deg")), "tan(90°) returns NaN (undefined)");
assert(calculateTrig("sin", Math.PI / 2, "rad") === 1, "sin(π/2 rad) = 1");
assert(calculateTrig("cos", Math.PI, "rad") === -1, "cos(π rad) = -1");
assert(calculateTrig("asin", 1, "deg") === 90, "asin(1) in deg = 90°");
assert(calculateTrig("atan", 1, "deg") === 45, "atan(1) in deg = 45°");

// 4. Programmer Mode (64-bit BigInt)
console.log("\n--- 4. Programmer 64-bit BigInt Architecture ---");
assert(maskBigIntToWordSize(0x1FFn, "BYTE") === 0xFFn, "BYTE mask truncates to 8 bits");
assert(maskBigIntToWordSize(0x1FFFFn, "WORD") === 0xFFFFn, "WORD mask truncates to 16 bits");
assert(maskBigIntToWordSize(0x1FFFFFFFFn, "DWORD") === 0xFFFFFFFFn, "DWORD mask truncates to 32 bits");
assert(formatHex(255n, "BYTE") === "FF", "HEX: 255n as BYTE = 'FF'");
assert(formatHex(65535n, "WORD") === "FFFF", "HEX: 65535n as WORD = 'FFFF'");
assert(formatDec(255n, "BYTE") === "-1", "DEC: 255n as BYTE two's complement = '-1'");
assert(formatDec(127n, "BYTE") === "127", "DEC: 127n as BYTE = '127'");
assert(formatDec(128n, "BYTE") === "-128", "DEC: 128n as BYTE = '-128'");
assert(formatBin(15n, "BYTE") === "0000 1111", "BIN: 15n as BYTE formatted nibbles");
assert(toggleBitAt(0n, 0, "QWORD") === 1n, "Bit toggle: 0 -> 1");
assert(toggleBitAt(1n, 0, "QWORD") === 0n, "Bit toggle: 1 -> 0");
assert(toggleBitAt(0n, 63, "QWORD") === 0x8000000000000000n, "Bit toggle: 63rd bit (MSB)");

// 5. Unit Conversion Rigor
console.log("\n--- 5. Unit Conversion Accuracy ---");
assert(convertUnits("length", "km", "m", 1) === 1000, "Length: 1 km = 1000 m");
assert(convertUnits("length", "mi", "m", 1) === 1609.344, "Length: 1 mi = 1609.344 m");
assert(convertUnits("length", "m", "m", 42) === 42, "Identity: 42 m = 42 m");
assert(convertUnits("mass", "kg", "g", 2.5) === 2500, "Mass: 2.5 kg = 2500 g");
assert(convertUnits("temperature", "c", "f", 0) === 32, "Temp: 0°C = 32°F");
assert(convertUnits("temperature", "c", "f", 100) === 212, "Temp: 100°C = 212°F");
assert(convertUnits("temperature", "f", "c", 32) === 0, "Temp: 32°F = 0°C");
assert(convertUnits("temperature", "f", "c", 212) === 100, "Temp: 212°F = 100°C");
assert(convertUnits("temperature", "c", "k", 0) === 273.15, "Temp: 0°C = 273.15 K");
assert(convertUnits("data", "gb", "mb", 1) === 1024, "Data: 1 GB = 1024 MB");
assert(convertUnits("data", "b", "bit", 1) === 8, "Data: 1 Byte = 8 bits");
assert(convertUnits("speed", "mph", "kmh", 60) > 96.5 && convertUnits("speed", "mph", "kmh", 60) < 96.6, "Speed: 60 mph ~ 96.56 km/h");
assert(UNIT_CATEGORIES.length >= 8, `Categories available: ${UNIT_CATEGORIES.length} categories`);

// Final summary
console.log("\n=======================================================");
console.log(` 🏁 Test Suite Completed: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=======================================================\n");

if (failedCount > 0) {
  process.exit(1);
}
