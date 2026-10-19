import { describe, it, expect } from "@jest/globals";
import { getTimeOfDay, getGreetingText } from "@/lib/greeting";

describe("User Currency and Local Time / Timezone System", () => {
  it("determines correct time of day based on specified timezone", () => {
    // 2026-10-19T10:00:00Z -> In UTC this is 10:00 AM (morning)
    const fixedDate = new Date("2026-10-19T10:00:00Z");
    const utcTimeOfDay = getTimeOfDay(fixedDate, "UTC");
    expect(utcTimeOfDay).toBe("morning");

    // In Asia/Dhaka (UTC+6), 10:00Z is 16:00 (4:00 PM -> afternoon)
    const dhakaTimeOfDay = getTimeOfDay(fixedDate, "Asia/Dhaka");
    expect(dhakaTimeOfDay).toBe("afternoon");

    // In Asia/Tokyo (UTC+9), 10:00Z is 19:00 (7:00 PM -> evening)
    const tokyoTimeOfDay = getTimeOfDay(fixedDate, "Asia/Tokyo");
    expect(tokyoTimeOfDay).toBe("evening");

    // In America/New_York (UTC-4 in daylight savings), 10:00Z is 06:00 (6:00 AM -> morning)
    const nyTimeOfDay = getTimeOfDay(fixedDate, "America/New_York");
    expect(nyTimeOfDay).toBe("morning");
  });

  it("returns appropriate greeting according to time of day bracket", () => {
    expect(getGreetingText("morning")).toBe("Good morning,");
    expect(getGreetingText("afternoon")).toBe("Good afternoon,");
    expect(getGreetingText("evening")).toBe("Good evening,");
    expect(getGreetingText("night")).toBe("Good night,");
  });

  it("formats currency correctly using selected user currency", () => {
    const amount = 5000;
    
    const bdtFormat = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(amount);
    expect(bdtFormat).toContain("5,000");

    const usdFormat = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
    expect(usdFormat).toContain("$5,000");

    const eurFormat = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
    expect(eurFormat).toContain("5,000");
  });
});
