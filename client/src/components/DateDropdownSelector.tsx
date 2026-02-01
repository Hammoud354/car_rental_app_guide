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
}

export function DateDropdownSelector({
  id,
  label,
  value,
  onChange,
  required = false,
}: DateDropdownSelectorProps) {
  const currentYear = new Date().getFullYear();
  // Allow years from 1990 to 10 years in the future for flexibility
  const years = Array.from({ length: currentYear - 1990 + 11 }, (_, i) => 1990 + i);
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
    const month = selectedMonth ?? 0;
    const day = selectedDay ?? 1;
    onChange(new Date(year, month, day));
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    const year = selectedYear ?? currentYear;
    const day = selectedDay ?? 1;
    const maxDay = getDaysInMonth(year, month);
    onChange(new Date(year, month, Math.min(day, maxDay)));
  };

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr);
    const year = selectedYear ?? currentYear;
    const month = selectedMonth ?? 0;
    onChange(new Date(year, month, day));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="grid grid-cols-3 gap-2">
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

        {/* Day Selector */}
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
      </div>
    </div>
  );
}
