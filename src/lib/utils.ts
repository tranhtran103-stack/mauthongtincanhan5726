import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility để merge Tailwind CSS classes
 * Kết hợp clsx (conditional classes) với tailwind-merge (resolve conflicts)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
