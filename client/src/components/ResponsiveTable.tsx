import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive table wrapper that adds horizontal scrolling on mobile devices
 * while maintaining full table layout on larger screens
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
        <div className={cn("overflow-hidden", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}
