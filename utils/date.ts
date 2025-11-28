import { format, startOfMonth } from 'date-fns';

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthStart(): Date {
  return startOfMonth(new Date());
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
