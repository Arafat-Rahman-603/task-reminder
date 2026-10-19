/**
 * Greeting utilities for dynamic, time-of-day greetings across the application.
 */

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/**
 * Determines the time of day bracket based on the hour.
 * 
 * Brackets:
 * - 05:00 - 11:59 (05 to 11): Morning (সকাল) -> "Good morning,"
 * - 12:00 - 16:59 (12 to 16): Afternoon (দুপুর) -> "Good afternoon,"
 * - 17:00 - 21:59 (17 to 21): Evening (বিকাল / সন্ধ্যা) -> "Good evening,"
 * - 22:00 - 04:59 (22 to 04): Night (রাত) -> "Good night,"
 */
export function getTimeOfDay(date: Date = new Date(), timezone?: string): TimeOfDay {
  let hour = date.getHours();

  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hourCycle: "h23",
      });
      const parts = formatter.formatToParts(date);
      const hourPart = parts.find((p) => p.type === "hour");
      if (hourPart) {
        const parsed = parseInt(hourPart.value, 10);
        if (!isNaN(parsed)) {
          hour = parsed;
        }
      }
    } catch {
      // Fallback to local hour if timezone string is unrecognized
    }
  }

  if (hour >= 5 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 17) {
    return "afternoon";
  } else if (hour >= 17 && hour < 22) {
    return "evening";
  } else {
    return "night";
  }
}

/**
 * Returns the greeting text according to the time of day bracket.
 */
export function getGreetingText(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "morning":
      return "Good morning,";
    case "afternoon":
      return "Good afternoon,";
    case "evening":
      return "Good evening,";
    case "night":
      return "Good night,";
  }
}

/**
 * Returns the tooltip title text for the greeting icon.
 */
export function getGreetingTitle(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "morning":
      return "Good morning!";
    case "afternoon":
      return "Good afternoon!";
    case "evening":
      return "Good evening!";
    case "night":
      return "Good night!";
  }
}
