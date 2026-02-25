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
  minYear?: number;
  maxYear?: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DatePickerWithYearNav({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  minYear = 1900,
  maxYear = 2050,
}: DatePickerWithYearNavProps) {
  const [month, setMonth] = useState<Date>(date || new Date());
  const [isOpen, setIsOpen] = useState(false);

  // Generate year array from minYear to maxYear
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  
  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth();
  const currentMonthName = monthNames[currentMonth];

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    const newDate = new Date(year, currentMonth, 1);
    setMonth(newDate);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(month);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setMonth(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
        <div className="p-3 space-y-2">
          {/* Header with Year and Month Selection */}
          <div className="flex items-center justify-between gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange('prev')}
              className="h-8 w-8 p-0 hover:bg-accent"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5 flex-1 justify-center">
              <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[80px] h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-xs font-semibold text-foreground min-w-[70px] text-center">
                {currentMonthName}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange('next')}
              className="h-8 w-8 p-0 hover:bg-accent"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-md border border-input overflow-hidden">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onDateChange(selectedDate);
                setIsOpen(false);
              }}
              month={month}
              onMonthChange={setMonth}
              fixedWeeks
              showOutsideDays={false}
              initialFocus
              classNames={{
                months: "w-full p-0 m-0",
                month: "w-full space-y-0 p-0 m-0",
                caption: "hidden",
                nav: "hidden",
                head_row: "grid grid-cols-7 bg-muted/40 border-b border-input",
                head_cell: "text-xs font-semibold text-muted-foreground py-1.5 text-center",
                row: "grid grid-cols-7 w-full",
                cell: "relative p-0 text-center text-xs flex items-center justify-center",
                day: "h-8 w-full flex items-center justify-center rounded-none hover:bg-blue-50 transition-colors",
                day_selected: "bg-blue-600 text-white hover:bg-blue-700 font-semibold",
                day_today: "bg-blue-500 text-white font-bold hover:bg-blue-600",
                day_outside: "text-muted-foreground opacity-40",
              }}
            />
          </div>

          {/* Footer with helpful text */}
          <div className="text-xs text-muted-foreground text-center py-1">
            Click a date to select, use arrows to navigate
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
