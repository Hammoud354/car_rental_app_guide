import { useState, useRef, useEffect } from "react";
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
  const [showYearPicker, setShowYearPicker] = useState(false);
  const yearGridRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth();
  const currentMonthName = monthNames[currentMonth];

  useEffect(() => {
    if (showYearPicker && selectedYearRef.current && yearGridRef.current) {
      selectedYearRef.current.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }, [showYearPicker]);

  const handleYearChange = (year: number) => {
    const newDate = new Date(year, currentMonth, 1);
    setMonth(newDate);
    setShowYearPicker(false);
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
    <Popover open={isOpen && !disabled} onOpenChange={(open) => { setIsOpen(open); if (!open) setShowYearPicker(false); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-white hover:bg-gray-50",
            !date && "text-gray-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          style={{ borderColor: '#1e3a8a', borderWidth: '1.5px' }}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
          <span className="truncate">{date ? format(date, "PPP") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-gray-300 shadow-md rounded-lg overflow-visible bg-white"
        align="start"
      >
        {showYearPicker ? (
          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Select Year</h3>
              <button
                onClick={() => setShowYearPicker(false)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ×
              </button>
            </div>
            <div
              ref={yearGridRef}
              className="grid grid-cols-4 gap-2 overflow-y-scroll"
              style={{ maxHeight: "260px", WebkitOverflowScrolling: "touch" }}
            >
              {years.map((year) => (
                <button
                  key={year}
                  ref={currentYear === year ? selectedYearRef : null}
                  onClick={() => handleYearChange(year)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded transition-colors",
                    currentYear === year
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-1 px-2 py-2 border-b border-gray-200 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMonthChange('prev')}
                className="h-7 w-7 p-0 hover:bg-gray-200 rounded transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="h-4 w-4 text-gray-700" />
              </Button>

              <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                <button
                  onClick={() => setShowYearPicker(true)}
                  className="px-2 py-1 text-xs font-semibold text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {currentYear}
                </button>

                <span className="text-xs font-semibold text-gray-900 px-1 truncate">
                  {currentMonthName}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMonthChange('next')}
                className="h-7 w-7 p-0 hover:bg-gray-200 rounded transition-colors"
                title="Next month"
              >
                <ChevronRight className="h-4 w-4 text-gray-700" />
              </Button>
            </div>

            <div className="px-2 py-2">
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
                  head_row: "grid grid-cols-7 gap-0",
                  head_cell: "text-xs font-bold text-gray-600 py-1 text-center h-6",
                  row: "grid grid-cols-7 gap-0",
                  cell: "relative p-0 text-center text-xs flex items-center justify-center h-7 border border-gray-100",
                  day: "h-7 w-7 flex items-center justify-center rounded-none hover:bg-blue-100 transition-colors text-gray-700 font-medium text-xs cursor-pointer",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700 font-semibold",
                  day_today: "border-2 border-blue-500 text-blue-600 font-bold bg-blue-50 hover:bg-blue-100",
                  day_outside: "text-gray-300 opacity-40",
                }}
              />
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
