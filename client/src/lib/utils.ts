import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string | null | undefined): string {
  if (!time) {
    return 'N/A';
  }
  
  try {
    // Handle overnight case
    if (time === 'overnight') {
      return 'Overnight stay';
    }
    
    // Check for time slots (Morning, Midday, etc.)
    if (time === 'morning') return 'Morning (8am-11am)';
    if (time === 'midday') return 'Midday (11am-2pm)';
    if (time === 'early-evening') return 'Early Evening (2pm-5pm)';
    if (time === 'late-evening') return 'Late Evening (5pm-8pm)';
    
    // Handle HH:MM:SS format
    if (time.includes(':')) {
      const [hours, minutes] = time.split(":").map(Number);
      
      // Validate hours and minutes
      if (isNaN(hours) || isNaN(minutes)) {
        return time; // Return original if parsing failed
      }
      
      // Convert to 12-hour format
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      
      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    }
    
    // Return original time if no pattern matched
    return time;
  } catch (error) {
    console.error("Error formatting time:", error);
    return time || 'N/A';
  }
}

export function formatDate(date: string | Date): string {
  try {
    // Special handling for YYYY-MM-DD format strings to avoid timezone shifts
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Parse the date parts directly
      const [year, month, day] = date.split('-').map(Number);
      // Create a date object using local timezone (note: month is 0-indexed)
      const dateObj = new Date(year, month - 1, day);
      return format(dateObj, "MMM d, yyyy");
    }
    
    // For other date formats, parse normally
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date);
  }
}

export function getStatusColor(status: string, isPaid?: boolean): string {
  const statusLower = status.toLowerCase();
  
  if (isPaid) {
    return "border-green-500 text-green-600";
  }
  
  if (statusLower === "outstanding") {
    return "border-red-500 text-red-600";
  }
  
  switch (statusLower) {
    case "scheduled":
      return "border-blue-500 text-blue-600";
    case "completed":
      return "border-purple-500 text-purple-600";
    case "cancelled":
      return "border-red-500 text-red-600";
    default:
      return "border-slate-500 text-slate-600";
  }
}

export function getInitials(name: string): string {
  if (!name) return "";
  
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function generateTimeSlots(): { value: string; label: string }[] {
  // Create specific time frames as per requirements
  return [
    { value: "09:00:00", label: "Morning (8am-11am)" },
    { value: "12:00:00", label: "Midday (11am-2pm)" },
    { value: "15:00:00", label: "Early Evening (2pm-5pm)" },
    { value: "18:00:00", label: "Late Evening (5pm-8pm)" },
    { value: "overnight", label: "Overnight" }
  ];
}

// Normalize any date input to YYYY-MM-DD format for consistent storage and comparison
// Uses local time methods to prevent timezone shifting issues
export function normalizeDate(date: string | Date): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Special handling for YYYY-MM-DD format to avoid timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Already in correct format, just return it
      return date;
    }
    
    // For other date formats, parse with normal Date constructor
    dateObj = new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error(`Invalid date string provided: ${date}`);
      return '';
    }
  } else {
    dateObj = date;
  }
  
  // Use LOCAL methods instead of UTC to maintain the same day across the application
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function formatCurrency(amount: string | number): string {
  // Convert to a number if it's a string
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  
  // Check if conversion resulted in a valid number
  if (isNaN(numericAmount)) {
    return '$0.00';
  }
  
  // Format the number as currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
}
