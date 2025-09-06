import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// UI Utilities
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

// Type Validation Utilities
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidEmail(value: unknown): boolean {
  if (!isNonEmptyString(value)) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isValidUrl(value: unknown): boolean {
  if (!isNonEmptyString(value)) {
    return false;
  }
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Date Utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to formatDate');
  }
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to formatRelativeTime');
  }

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return 'just now';
  }
  if (minutes === 1) {
    return '1 minute ago';
  }
  return `${minutes} minutes ago`;
}

export function isFutureDate(date: Date | string): boolean {
  try {
    const d = new Date(date);
    return d.getTime() > Date.now();
  } catch {
    return false;
  }
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

// String Utilities
export function capitalize(str: string): string {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length - suffix.length) + suffix;
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function toCamelCase(str: string): string {
  return str.toLowerCase().replace(/[-_\s]+(.)?/g, (match: string, char: string | undefined) => {
    return char ? char.toUpperCase() : '';
  });
}

export function getInitials(name: string, maxInitials = 2): string {
  return name
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, maxInitials)
    .join('');
}

// Array Utilities
export function uniqueBy<T>(array: T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be positive');
  }
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

// Object Utilities
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

// Error Utilities
export function handleError(error: unknown): {
  message: string;
  code?: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name,
      stack: error.stack,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: 'Unknown error occurred' };
}

export function createApiError(
  message: string,
  code: string,
  status = 500
): {
  message: string;
  code: string;
  status: number;
  timestamp: string;
} {
  return {
    message,
    code,
    status,
    timestamp: new Date().toISOString(),
  };
}

// Async Utilities
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts - 1) {
        await delay(delayMs * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = delay(timeoutMs).then(() => {
    throw new Error(message);
  });
  return Promise.race([promise, timeoutPromise]);
}
