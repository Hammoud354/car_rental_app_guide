import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateDropdownSelectorProps {
  id: string;
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  required?: boolean;
  minDate?: Date; // Minimum allowed date
  maxDate?: Date; // Maximum allowed date
  yearOnly?: boolean; // Only show year selector
}

export function DateDropdownSelector({
  id,
  label,
  value,
  onChange,
  required = false,
  minDate,
  maxDate,
  yearOnly = false,
}: DateDropdownSelectorProps) {
  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : (yearOnly ? 1950 : 1990);
  const maxYear = maxDate ? maxDate.getFullYear() : (yearOnly ? 2050 : currentYear + 10);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  const selectedYear = value?.getFullYear();
  const selectedMonth = value?.getMonth();
  const selectedDay = value?.getDate();

  const getDaysInMonth = (year: number | undefined, month: number | undefined) => {
    if (year === undefined || month === undefined) return 31;
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    const month = yearOnly ? 0 : (selectedMonth ?? 0);
    const day = yearOnly ? 1 : (selectedDay ?? 1);
    const newDate = new Date(year, month, day);
    
    // Validate against min/max dates
    if (minDate && newDate < minDate) {
      onChange(minDate);
      return;
    }
    if (maxDate && newDate > maxDate) {
      onChange(maxDate);
      return;
    }
    
    onChange(newDate);
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    const year = selectedYear ?? currentYear;
    const day = selectedDay ?? 1;
    const maxDay = getDaysInMonth(year, month);
    const newDate = new Date(year, month, Math.min(day, maxDay));
    
    // Validate against min/max dates
    if (minDate && newDate < minDate) {
      onChange(minDate);
      return;
    }
    if (maxDate && newDate > maxDate) {
      onChange(maxDate);
      return;
    }
    
    onChange(newDate);
  };

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr);
    const year = selectedYear ?? currentYear;
    const month = selectedMonth ?? 0;
    const newDate = new Date(year, month, day);
    
    // Validate against min/max dates
    if (minDate && newDate < minDate) {
      onChange(minDate);
      return;
    }
    if (maxDate && newDate > maxDate) {
      onChange(maxDate);
      return;
    }
    
    onChange(newDate);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className={yearOnly ? "grid grid-cols-1 gap-2" : "grid grid-cols-3 gap-2"}>
        {/* Year Selector */}
        <Select
          value={selectedYear?.toString()}
          onValueChange={handleYearChange}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month Selector */}
        {!yearOnly && (
          <Select
            value={selectedMonth?.toString()}
            onValueChange={handleMonthChange}
            required={required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Day Selector */}
        {!yearOnly && (
          <Select
            value={selectedDay?.toString()}
            onValueChange={handleDayChange}
            required={required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {days.map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
