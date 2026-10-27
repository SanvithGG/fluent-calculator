import { useState, useMemo } from "react";
import { UNIT_CATEGORIES, convertUnits } from "@/lib/converters";
import { Button } from "./ui/button";
import { playKeyClick } from "@/lib/sound";
import {
  ArrowUpDown,
  Delete,
  Ruler,
  Scale,
  Thermometer,
  HardDrive,
  Gauge,
  Clock,
  Beaker,
  Square,
  DollarSign,
} from "lucide-react";

export function ConverterScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("length");
  const [fromValue, setFromValue] = useState("1");
  const [activeInput, setActiveInput] = useState<"from" | "to">("from");

  const category = useMemo(() => {
    return (
      UNIT_CATEGORIES.find((c) => c.id === selectedCategoryId) ||
      UNIT_CATEGORIES[0]
    );
  }, [selectedCategoryId]);

  const [fromUnitId, setFromUnitId] = useState(category.units[0].id);
  const [toUnitId, setToUnitId] = useState(
    category.units[1]?.id || category.units[0].id
  );

  const click = (type: "number" | "operator" | "equals" | "clear" = "number") => {
    playKeyClick(type);
  };

  // When category changes, reset units
  const handleSelectCategory = (catId: string) => {
    click("operator");
    setSelectedCategoryId(catId);
    const cat = UNIT_CATEGORIES.find((c) => c.id === catId);
    if (cat && cat.units.length >= 2) {
      setFromUnitId(cat.units[0].id);
      setToUnitId(cat.units[1].id);
    }
  };

  // Convert calculated value
  const numVal = parseFloat(fromValue) || 0;
  const convertedVal = useMemo(() => {
    const res = convertUnits(selectedCategoryId, fromUnitId, toUnitId, numVal);
    if (isNaN(res)) return 0;
    return parseFloat(res.toPrecision(8));
  }, [selectedCategoryId, fromUnitId, toUnitId, numVal]);

  // Unit swap
  const handleSwapUnits = () => {
    click("operator");
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  // Keypad inputs
  const inputDigit = (d: string) => {
    click("number");
    if (fromValue === "0" && d !== ".") {
      setFromValue(d);
    } else if (fromValue.length < 12) {
      setFromValue(fromValue + d);
    }
  };

  const inputDecimal = () => {
    click("number");
    if (!fromValue.includes(".")) {
      setFromValue(fromValue + ".");
    }
  };

  const handleBackspace = () => {
    click("clear");
    if (fromValue.length > 1) {
      setFromValue(fromValue.slice(0, -1));
    } else {
      setFromValue("0");
    }
  };

  const handleClear = () => {
    click("clear");
    setFromValue("0");
  };

  // Icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    length: <Ruler className="size-3.5" />,
    mass: <Scale className="size-3.5" />,
    temperature: <Thermometer className="size-3.5" />,
    data: <HardDrive className="size-3.5" />,
    speed: <Gauge className="size-3.5" />,
    time: <Clock className="size-3.5" />,
    volume: <Beaker className="size-3.5" />,
    area: <Square className="size-3.5" />,
    currency: <DollarSign className="size-3.5" />,
  };

  const fromUnitObj = category.units.find((u) => u.id === fromUnitId) || category.units[0];
  const toUnitObj = category.units.find((u) => u.id === toUnitId) || category.units[1];

  return (
    <div className="flex flex-col h-full w-full justify-between p-3 gap-2">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
        {UNIT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-colors ${
              selectedCategoryId === cat.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {categoryIcons[cat.id]}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Input / Output Value Cards */}
      <div className="flex flex-col gap-2 rounded-xl bg-card/60 p-3 border border-border/50 shadow-sm backdrop-blur-md">
        {/* From Box */}
        <div
          onClick={() => setActiveInput("from")}
          className={`flex flex-col gap-1 p-2.5 rounded-lg border transition-all ${
            activeInput === "from"
              ? "bg-primary/5 border-primary/40 ring-1 ring-primary/30"
              : "bg-muted/20 border-border/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              From
            </span>
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id} className="bg-popover text-foreground">
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground truncate">
            {fromValue} {fromUnitObj.symbol}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex items-center justify-center -my-1 z-10">
          <Button
            variant="action"
            size="icon-sm"
            onClick={handleSwapUnits}
            className="rounded-full shadow-sm hover:scale-105 active:scale-95"
            title="Swap units"
          >
            <ArrowUpDown className="size-3.5" />
          </Button>
        </div>

        {/* To Box */}
        <div
          onClick={() => setActiveInput("to")}
          className={`flex flex-col gap-1 p-2.5 rounded-lg border transition-all ${
            activeInput === "to"
              ? "bg-primary/5 border-primary/40 ring-1 ring-primary/30"
              : "bg-muted/20 border-border/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              To
            </span>
            <select
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id} className="bg-popover text-foreground">
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="text-2xl font-bold font-mono text-primary truncate">
            {convertedVal.toLocaleString("en-US", { maximumFractionDigits: 6 })} {toUnitObj.symbol}
          </div>
        </div>

        {/* Rate Reference */}
        <div className="text-[11px] text-muted-foreground font-mono text-center pt-0.5">
          1 {fromUnitObj.name} ={" "}
          {convertUnits(selectedCategoryId, fromUnitId, toUnitId, 1).toLocaleString("en-US", {
            maximumFractionDigits: 6,
          })}{" "}
          {toUnitObj.name}
        </div>
      </div>

      {/* Numeric Keypad for fast conversion entry */}
      <div className="grid grid-cols-4 gap-1.5 flex-1 max-h-[220px]">
        <Button variant="number" size="keypad" onClick={() => inputDigit("7")}>
          7
        </Button>
        <Button variant="number" size="keypad" onClick={() => inputDigit("8")}>
          8
        </Button>
        <Button variant="number" size="keypad" onClick={() => inputDigit("9")}>
          9
        </Button>
        <Button variant="action" size="keypad" onClick={handleClear}>
          C
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
        <Button variant="action" size="keypad" onClick={handleBackspace}>
          <Delete className="size-4" />
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
          variant="action"
          size="keypad"
          onClick={() => {
            const num = parseFloat(fromValue);
            if (!isNaN(num)) setFromValue(String(-num));
          }}
        >
          ±
        </Button>

        <Button variant="number" size="keypad" onClick={() => inputDigit("0")} className="col-span-2">
          0
        </Button>
        <Button variant="number" size="keypad" onClick={inputDecimal} className="col-span-2">
          .
        </Button>
      </div>
    </div>
  );
}
