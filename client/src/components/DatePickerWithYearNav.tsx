import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerWithYearNavProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerWithYearNav({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
}: DatePickerWithYearNavProps) {
  const [month, setMonth] = useState<Date>(date || new Date());
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleYearChange = (year: string) => {
    const newDate = new Date(month);
    newDate.setFullYear(parseInt(year));
    setMonth(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(month);
    newDate.setMonth(parseInt(monthIndex));
    setMonth(newDate);
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
      <PopoverContent className="w-auto p-0 h-auto max-h-none" align="start">
        <div className="flex items-center justify-between p-3 border-b">
          <Select
            value={month.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={month.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-[280px] flex flex-col">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            month={month}
            onMonthChange={setMonth}
            fixedWeeks
            showOutsideDays
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
