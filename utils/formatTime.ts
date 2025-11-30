/**
 * Format seconds into a human-readable time string
 * Examples:
 * - 45 -> "45s"
 * - 120 -> "2m"
 * - 3665 -> "1h 1m"
 * - 7325 -> "2h 2m 5s"
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (remainingSeconds > 0 && hours === 0) {
    // Only show seconds if less than an hour
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(' ') || '0s';
}

/**
 * Format seconds into a more detailed string with all components
 */
export function formatTimeDetailed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (remainingSeconds > 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(' ') || '0s';
}

