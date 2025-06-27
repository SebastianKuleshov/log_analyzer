import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000)
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (num < 1000000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
}

export function calculateFontSize(
  count: number,
  minSize = 0.75,
  maxSize = 1.2
): number {
  if (count <= 1) return minSize;
  const scale = (Math.log(count) / Math.log(10)) * 0.1 + 0.75;
  return Math.min(Math.max(scale, minSize), maxSize);
}

export function calculateOpacity(
  count: number,
  minOpacity = 0.6,
  maxOpacity = 1
): number {
  if (count <= 1) return minOpacity;
  const scale = (Math.log(count) / Math.log(100)) * 0.4 + 0.6;
  return Math.min(Math.max(scale, minOpacity), maxOpacity);
}
