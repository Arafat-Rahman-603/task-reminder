import { getTimeOfDay, getGreetingText, getGreetingTitle, TimeOfDay } from "@/lib/greeting";

describe("Greeting utilities", () => {
  describe("getTimeOfDay", () => {
    it("returns 'morning' between 05:00 and 11:59", () => {
      const d1 = new Date(2026, 9, 19, 5, 0, 0);
      const d2 = new Date(2026, 9, 19, 8, 30, 0);
      const d3 = new Date(2026, 9, 19, 11, 59, 59);

      expect(getTimeOfDay(d1)).toBe("morning");
      expect(getTimeOfDay(d2)).toBe("morning");
      expect(getTimeOfDay(d3)).toBe("morning");
    });

    it("returns 'afternoon' between 12:00 and 16:59", () => {
      const d1 = new Date(2026, 9, 19, 12, 0, 0);
      const d2 = new Date(2026, 9, 19, 14, 15, 0);
      const d3 = new Date(2026, 9, 19, 16, 59, 59);

      expect(getTimeOfDay(d1)).toBe("afternoon");
      expect(getTimeOfDay(d2)).toBe("afternoon");
      expect(getTimeOfDay(d3)).toBe("afternoon");
    });

    it("returns 'evening' between 17:00 and 21:59", () => {
      const d1 = new Date(2026, 9, 19, 17, 0, 0);
      const d2 = new Date(2026, 9, 19, 19, 30, 0);
      const d3 = new Date(2026, 9, 19, 21, 59, 59);

      expect(getTimeOfDay(d1)).toBe("evening");
      expect(getTimeOfDay(d2)).toBe("evening");
      expect(getTimeOfDay(d3)).toBe("evening");
    });

    it("returns 'night' between 22:00 and 04:59", () => {
      const d1 = new Date(2026, 9, 19, 22, 0, 0);
      const d2 = new Date(2026, 9, 19, 23, 45, 0);
      const d3 = new Date(2026, 9, 19, 0, 30, 0);
      const d4 = new Date(2026, 9, 19, 4, 59, 59);

      expect(getTimeOfDay(d1)).toBe("night");
      expect(getTimeOfDay(d2)).toBe("night");
      expect(getTimeOfDay(d3)).toBe("night");
      expect(getTimeOfDay(d4)).toBe("night");
    });

    it("supports timezone calculation via Intl", () => {
      // 13:00 UTC = 19:00 in Asia/Dhaka (+6) -> evening
      const utcTime = new Date(Date.UTC(2026, 9, 19, 13, 0, 0));
      expect(getTimeOfDay(utcTime, "Asia/Dhaka")).toBe("evening");

      // 13:00 UTC = 09:00 in America/New_York (-4) -> morning
      expect(getTimeOfDay(utcTime, "America/New_York")).toBe("morning");
    });
  });

  describe("getGreetingText", () => {
    it("returns correct greeting text for all periods", () => {
      expect(getGreetingText("morning")).toBe("Good morning,");
      expect(getGreetingText("afternoon")).toBe("Good afternoon,");
      expect(getGreetingText("evening")).toBe("Good evening,");
      expect(getGreetingText("night")).toBe("Good night,");
    });
  });

  describe("getGreetingTitle", () => {
    it("returns correct title for all periods", () => {
      expect(getGreetingTitle("morning")).toBe("Good morning!");
      expect(getGreetingTitle("afternoon")).toBe("Good afternoon!");
      expect(getGreetingTitle("evening")).toBe("Good evening!");
      expect(getGreetingTitle("night")).toBe("Good night!");
    });
  });
});
