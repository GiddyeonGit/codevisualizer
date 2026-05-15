export interface DateFormatOptions {
  locale: string;
  timezone: string;
}

export function formatDate(date: Date, options?: DateFormatOptions): string {
  return date.toLocaleDateString(options?.locale);
}

export function parseDate(input: string): Date {
  return new Date(input);
}
