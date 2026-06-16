import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateRange } from "react-day-picker"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isTicketWithinDateRange(
  bookedAtStr: string,
  dateRange: DateRange | undefined
): boolean {
  if (!dateRange) return true;
  const bookedTime = new Date(bookedAtStr).getTime();
  
  if (dateRange.from && dateRange.to) {
    const start = new Date(dateRange.from);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(dateRange.to);
    end.setUTCHours(23, 59, 59, 999);
    return bookedTime >= start.getTime() && bookedTime <= end.getTime();
  }
  
  if (dateRange.from) {
    const start = new Date(dateRange.from);
    start.setUTCHours(0, 0, 0, 0);
    return bookedTime >= start.getTime();
  }
  
  return true;
}
