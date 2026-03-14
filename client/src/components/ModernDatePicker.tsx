import { useState } from "react";
import { format, isToday } from "date-fns";
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

interface ModernDatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function ModernDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  minYear = 1900,
  maxYear = 2050,
  disabled = false,
}: ModernDatePickerProps) {
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
    <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-white hover:bg-gray-50 border-gray-200",
            !date && "text-gray-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden" 
        align="start"
      >
        <div className="p-3 bg-white">
          {/* Header with Year and Month Selection */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange('prev')}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </Button>

            <div className="flex items-center gap-2 flex-1 justify-center">
              <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[80px] h-8 text-xs font-semibold border-gray-200 bg-white hover:bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-xs font-semibold text-gray-900 min-w-[70px] text-center">
                {currentMonthName}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange('next')}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md transition-colors"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-md border border-gray-200 overflow-hidden bg-white">
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
                head_row: "grid grid-cols-7 bg-gray-50 border-b border-gray-100",
                head_cell: "text-xs font-semibold text-gray-600 py-2 text-center",
                row: "grid grid-cols-7 w-full",
                cell: "relative p-0 text-center text-xs flex items-center justify-center h-9",
                day: "h-9 w-full flex items-center justify-center rounded hover:bg-blue-50 transition-all duration-150 text-gray-700 font-medium text-sm",
                day_selected: "bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm",
                day_today: "border-2 border-blue-500 text-blue-600 font-bold hover:bg-blue-50 bg-blue-50",
                day_outside: "text-gray-300 opacity-50",
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
