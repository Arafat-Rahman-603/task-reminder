/**
 * Date formatting utilities that produce consistent output on both server and client.
 * 
 * IMPORTANT: Never use new Date().toLocaleDateString() without a fixed locale in
 * SSR/hydrated React components — it produces different output on server (Node.js
 * locale) vs client (browser locale), causing hydration mismatches.
 * 
 * Always use these helpers instead.
 */

/**
 * Format a date as DD/MM/YYYY (e.g. 07/10/2026)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "None";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Format a date as a readable string (e.g. "7 Oct 2026")
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return "None";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Format a time as HH:MM (e.g. "14:30")
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Format date + time together (e.g. "07/10/2026 at 14:30")
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "None";
  const d = formatDate(date);
  const t = formatTime(date);
  return t ? `${d} at ${t}` : d;
}

/**
 * Format a relative time (e.g. "2 hours ago", "in 3 days")
 * Uses Intl.RelativeTimeFormat with fixed locale for consistency.
 */
export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const diffMs = d.getTime() - Date.now();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (Math.abs(diffDay) >= 1) return rtf.format(diffDay, "day");
    if (Math.abs(diffHour) >= 1) return rtf.format(diffHour, "hour");
    if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, "minute");
    return rtf.format(diffSec, "second");
  } catch {
    return "";
  }
}
