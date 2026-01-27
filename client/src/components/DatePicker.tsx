import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id: string;
  name: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "Pick a date",
  required = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setIsOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={value ? format(value, "yyyy-MM-dd") : ""}
        required={required}
      />
    </>
  );
}
