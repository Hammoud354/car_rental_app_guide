import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithYearNavProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  minYear?: number; // Minimum year allowed
  maxYear?: number; // Maximum year allowed (default: 2050)
}

export function DatePickerWithYearNav({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  minYear = 1900,
  maxYear = 2050,
}: DatePickerWithYearNavProps) {
  const [month, setMonth] = useState<Date>(date || new Date());

  // Create disabled function for dates outside the year range
  const isDateDisabled = (date: Date) => {
    const year = date.getFullYear();
    return year < minYear || year > maxYear;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          month={month}
          onMonthChange={setMonth}
          fixedWeeks
          showOutsideDays={false}
          initialFocus
          captionLayout="dropdown"
          disabled={isDateDisabled}
        />
      </PopoverContent>
    </Popover>
  );
}
