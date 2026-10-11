import { PLAN_LIMITS } from "@/config/plans";

describe("Pricing and Plan Consistency", () => {
  it("defines clear limits for free, pro, and enterprise plans", () => {
    expect(PLAN_LIMITS.free).toBeDefined();
    expect(PLAN_LIMITS.pro).toBeDefined();
    expect(PLAN_LIMITS.enterprise).toBeDefined();
  });

  it("verifies accurate prices without placeholder drift", () => {
    expect(PLAN_LIMITS.free.price).toBe("$0");
    expect(PLAN_LIMITS.free.priceNum).toBe(0);
    expect(PLAN_LIMITS.free.period).toBe("/mo");

    expect(PLAN_LIMITS.pro.price).toBe("$3.69");
    expect(PLAN_LIMITS.pro.priceNum).toBe(3.69);
    expect(PLAN_LIMITS.pro.period).toBe("/mo");

    expect(PLAN_LIMITS.enterprise.price).toBe("Custom");
  });

  it("enforces increasing tier limits for members and custom sections", () => {
    // Custom sections progression
    expect(PLAN_LIMITS.free.maxCustomSections).toBe(2);
    expect(PLAN_LIMITS.pro.maxCustomSections).toBe(10);
    expect(PLAN_LIMITS.enterprise.maxCustomSections).toBe(100);

    expect(PLAN_LIMITS.free.maxCustomSections).toBeLessThan(PLAN_LIMITS.pro.maxCustomSections);
    expect(PLAN_LIMITS.pro.maxCustomSections).toBeLessThan(PLAN_LIMITS.enterprise.maxCustomSections);

    // Member progression
    expect(PLAN_LIMITS.free.maxMembers).toBe(5);
    expect(PLAN_LIMITS.pro.maxMembers).toBe(10);
    expect(PLAN_LIMITS.enterprise.maxMembers).toBeGreaterThan(100);
  });

  it("accurately categorizes targets into individual and team tiers", () => {
    expect(PLAN_LIMITS.free.target).toBe("individual");
    expect(PLAN_LIMITS.pro.target).toBe("team");
    expect(PLAN_LIMITS.enterprise.target).toBe("enterprise");
  });
});
