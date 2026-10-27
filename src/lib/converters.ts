// Unit conversion definitions and calculation engine

export interface UnitCategory {
  id: string;
  name: string;
  icon: string;
  units: { id: string; name: string; symbol: string; factor: number; offset?: number }[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: "length",
    name: "Length",
    icon: "Ruler",
    units: [
      { id: "m", name: "Meters", symbol: "m", factor: 1 },
      { id: "km", name: "Kilometers", symbol: "km", factor: 1000 },
      { id: "cm", name: "Centimeters", symbol: "cm", factor: 0.01 },
      { id: "mm", name: "Millimeters", symbol: "mm", factor: 0.001 },
      { id: "mi", name: "Miles", symbol: "mi", factor: 1609.344 },
      { id: "yd", name: "Yards", symbol: "yd", factor: 0.9144 },
      { id: "ft", name: "Feet", symbol: "ft", factor: 0.3048 },
      { id: "in", name: "Inches", symbol: "in", factor: 0.0254 },
      { id: "nmi", name: "Nautical Miles", symbol: "NM", factor: 1852 },
    ],
  },
  {
    id: "mass",
    name: "Weight & Mass",
    icon: "Scale",
    units: [
      { id: "kg", name: "Kilograms", symbol: "kg", factor: 1 },
      { id: "g", name: "Grams", symbol: "g", factor: 0.001 },
      { id: "mg", name: "Milligrams", symbol: "mg", factor: 0.000001 },
      { id: "lb", name: "Pounds", symbol: "lb", factor: 0.45359237 },
      { id: "oz", name: "Ounces", symbol: "oz", factor: 0.028349523125 },
      { id: "t", name: "Metric Tons", symbol: "t", factor: 1000 },
      { id: "st", name: "Stones", symbol: "st", factor: 6.35029318 },
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    icon: "Thermometer",
    units: [
      { id: "c", name: "Celsius", symbol: "°C", factor: 1, offset: 0 },
      { id: "f", name: "Fahrenheit", symbol: "°F", factor: 5 / 9, offset: 32 },
      { id: "k", name: "Kelvin", symbol: "K", factor: 1, offset: 273.15 },
    ],
  },
  {
    id: "data",
    name: "Data Storage",
    icon: "HardDrive",
    units: [
      { id: "b", name: "Bytes", symbol: "B", factor: 1 },
      { id: "kb", name: "Kilobytes", symbol: "KB", factor: 1024 },
      { id: "mb", name: "Megabytes", symbol: "MB", factor: 1024 ** 2 },
      { id: "gb", name: "Gigabytes", symbol: "GB", factor: 1024 ** 3 },
      { id: "tb", name: "Terabytes", symbol: "TB", factor: 1024 ** 4 },
      { id: "bit", name: "Bits", symbol: "b", factor: 0.125 },
    ],
  },
  {
    id: "speed",
    name: "Speed",
    icon: "Gauge",
    units: [
      { id: "kmh", name: "Kilometers per hour", symbol: "km/h", factor: 1 },
      { id: "mph", name: "Miles per hour", symbol: "mph", factor: 1.609344 },
      { id: "ms", name: "Meters per second", symbol: "m/s", factor: 3.6 },
      { id: "knot", name: "Knots", symbol: "kn", factor: 1.852 },
    ],
  },
  {
    id: "time",
    name: "Time",
    icon: "Clock",
    units: [
      { id: "s", name: "Seconds", symbol: "s", factor: 1 },
      { id: "ms", name: "Milliseconds", symbol: "ms", factor: 0.001 },
      { id: "min", name: "Minutes", symbol: "min", factor: 60 },
      { id: "h", name: "Hours", symbol: "hr", factor: 3600 },
      { id: "d", name: "Days", symbol: "d", factor: 86400 },
      { id: "wk", name: "Weeks", symbol: "wk", factor: 604800 },
      { id: "yr", name: "Years", symbol: "yr", factor: 31536000 },
    ],
  },
  {
    id: "volume",
    name: "Volume",
    icon: "Beaker",
    units: [
      { id: "l", name: "Liters", symbol: "L", factor: 1 },
      { id: "ml", name: "Milliliters", symbol: "mL", factor: 0.001 },
      { id: "gal", name: "Gallons (US)", symbol: "gal", factor: 3.78541 },
      { id: "qt", name: "Quarts (US)", symbol: "qt", factor: 0.946353 },
      { id: "pt", name: "Pints (US)", symbol: "pt", factor: 0.473176 },
      { id: "cup", name: "Cups (US)", symbol: "cup", factor: 0.24 },
      { id: "floz", name: "Fluid Ounces", symbol: "fl oz", factor: 0.0295735 },
      { id: "m3", name: "Cubic Meters", symbol: "m³", factor: 1000 },
    ],
  },
  {
    id: "area",
    name: "Area",
    icon: "Square",
    units: [
      { id: "m2", name: "Square Meters", symbol: "m²", factor: 1 },
      { id: "km2", name: "Square Kilometers", symbol: "km²", factor: 1e6 },
      { id: "ft2", name: "Square Feet", symbol: "ft²", factor: 0.092903 },
      { id: "yd2", name: "Square Yards", symbol: "yd²", factor: 0.836127 },
      { id: "mi2", name: "Square Miles", symbol: "mi²", factor: 2.58999e6 },
      { id: "acre", name: "Acres", symbol: "ac", factor: 4046.86 },
      { id: "ha", name: "Hectares", symbol: "ha", factor: 10000 },
    ],
  },
  {
    id: "currency",
    name: "Currency (Exchange)",
    icon: "DollarSign",
    units: [
      { id: "usd", name: "US Dollar", symbol: "$", factor: 1 },
      { id: "eur", name: "Euro", symbol: "€", factor: 1.08 },
      { id: "gbp", name: "British Pound", symbol: "£", factor: 1.28 },
      { id: "inr", name: "Indian Rupee", symbol: "₹", factor: 0.012 },
      { id: "jpy", name: "Japanese Yen", symbol: "¥", factor: 0.0066 },
      { id: "cad", name: "Canadian Dollar", symbol: "C$", factor: 0.73 },
      { id: "aud", name: "Australian Dollar", symbol: "A$", factor: 0.65 },
      { id: "cny", name: "Chinese Yuan", symbol: "¥", factor: 0.14 },
    ],
  },
];

export function convertUnits(
  categoryId: string,
  fromUnitId: string,
  toUnitId: string,
  value: number
): number {
  if (isNaN(value)) return 0;
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return value;

  const fromUnit = category.units.find((u) => u.id === fromUnitId);
  const toUnit = category.units.find((u) => u.id === toUnitId);
  if (!fromUnit || !toUnit) return value;

  if (fromUnitId === toUnitId) return value;

  if (categoryId === "temperature") {
    // Convert from -> Celsius
    let celsius = value;
    if (fromUnitId === "f") {
      celsius = ((value - 32) * 5) / 9;
    } else if (fromUnitId === "k") {
      celsius = value - 273.15;
    }

    // Convert Celsius -> to
    if (toUnitId === "f") {
      return (celsius * 9) / 5 + 32;
    } else if (toUnitId === "k") {
      return celsius + 273.15;
    }
    return celsius;
  }

  // Base factor conversion
  const baseValue = value * fromUnit.factor;
  return baseValue / toUnit.factor;
}
