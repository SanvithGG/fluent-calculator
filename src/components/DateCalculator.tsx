import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { playKeyClick } from "@/lib/sound";
import { Calendar as CalendarIcon, Clock, ArrowRight } from "lucide-react";

export function DateCalculator() {
  const [subMode, setSubMode] = useState<"diff" | "addsub">("diff");

  // Mode 1: Difference
  const todayStr = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  // Mode 2: Add / Subtract
  const [startDate, setStartDate] = useState(todayStr);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [yearsInput, setYearsInput] = useState(0);
  const [monthsInput, setMonthsInput] = useState(0);
  const [daysInput, setDaysInput] = useState(0);

  const click = () => playKeyClick("action");

  // Calculate Date Difference
  const diffResult = useMemo(() => {
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return { days: 0, summary: "Invalid Date" };
    }

    const timeDiff = d2.getTime() - d1.getTime();
    const totalDays = Math.round(Math.abs(timeDiff) / (1000 * 3600 * 24));

    // Approximate years, months, days
    const minD = d1 < d2 ? d1 : d2;
    const maxD = d1 < d2 ? d2 : d1;

    let years = maxD.getFullYear() - minD.getFullYear();
    let months = maxD.getMonth() - minD.getMonth();
    let days = maxD.getDate() - minD.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(maxD.getFullYear(), maxD.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);

    return {
      days: totalDays,
      summary: parts.join(", "),
      weeks: Math.floor(totalDays / 7),
      remainDays: totalDays % 7,
    };
  }, [fromDate, toDate]);

  // Calculate Add/Subtract result
  const calculatedTargetDate = useMemo(() => {
    const base = new Date(startDate);
    if (isNaN(base.getTime())) return "Invalid Date";

    const mult = operation === "add" ? 1 : -1;
    const target = new Date(base);

    target.setFullYear(target.getFullYear() + mult * yearsInput);
    target.setMonth(target.getMonth() + mult * monthsInput);
    target.setDate(target.getDate() + mult * daysInput);

    return target.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [startDate, operation, yearsInput, monthsInput, daysInput]);

  return (
    <div className="flex flex-col h-full w-full justify-start p-3 gap-3 overflow-y-auto">
      {/* Sub-mode Tab Buttons */}
      <div className="flex rounded-lg bg-muted/50 p-1 border border-border/40 text-xs">
        <button
          onClick={() => {
            click();
            setSubMode("diff");
          }}
          className={`flex-1 py-1.5 rounded-md font-semibold transition-colors ${
            subMode === "diff"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Difference between dates
        </button>
        <button
          onClick={() => {
            click();
            setSubMode("addsub");
          }}
          className={`flex-1 py-1.5 rounded-md font-semibold transition-colors ${
            subMode === "addsub"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Add or subtract days
        </button>
      </div>

      {subMode === "diff" ? (
        <div className="flex flex-col gap-3">
          {/* From & To Date Pickers */}
          <div className="flex flex-col gap-2 rounded-xl bg-card/60 p-3 border border-border/50 shadow-sm backdrop-blur-md">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="flex flex-col gap-2 rounded-xl bg-primary/10 p-4 border border-primary/20 shadow-sm">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Difference
            </span>
            <div className="text-3xl font-bold font-mono text-foreground">
              {diffResult.days} <span className="text-base font-normal text-muted-foreground">days</span>
            </div>
            <div className="text-sm font-medium text-foreground/90">
              {diffResult.summary}
            </div>
            <div className="text-xs text-muted-foreground">
              or {diffResult.weeks} weeks and {diffResult.remainDays} days
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Start Date */}
          <div className="flex flex-col gap-2 rounded-xl bg-card/60 p-3 border border-border/50 shadow-sm backdrop-blur-md">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Operation Toggle */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOperation("add")}
                className={`flex-1 py-1 rounded-md text-xs font-semibold transition-colors ${
                  operation === "add"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Add (+)
              </button>
              <button
                onClick={() => setOperation("subtract")}
                className={`flex-1 py-1 rounded-md text-xs font-semibold transition-colors ${
                  operation === "subtract"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Subtract (-)
              </button>
            </div>

            {/* Years, Months, Days Inputs */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Years</span>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={yearsInput}
                  onChange={(e) => setYearsInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="rounded-lg border border-border bg-background p-1.5 text-center text-sm font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Months</span>
                <input
                  type="number"
                  min="0"
                  max="1200"
                  value={monthsInput}
                  onChange={(e) => setMonthsInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="rounded-lg border border-border bg-background p-1.5 text-center text-sm font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Days</span>
                <input
                  type="number"
                  min="0"
                  max="36500"
                  value={daysInput}
                  onChange={(e) => setDaysInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="rounded-lg border border-border bg-background p-1.5 text-center text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Result Target Date Card */}
          <div className="flex flex-col gap-1.5 rounded-xl bg-primary/10 p-4 border border-primary/20 shadow-sm">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Result Date
            </span>
            <div className="text-lg font-bold text-foreground">
              {calculatedTargetDate}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
