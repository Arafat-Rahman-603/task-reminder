"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; immediate?: boolean; duration?: number }) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect accessibility: prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Touch device detection (mobile phones & tablets)
    // Mobile browsers (iOS Safari, Android Chrome) have hardware-accelerated 120Hz GPU touch physics.
    // Intercepting touch events with JS creates latency and micro-jank on mobile.
    const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    if (isTouchDevice) {
      // On mobile touch devices, allow the native OS compositor to provide 100% friction-free 120Hz/60Hz scrolling
      return;
    }

    const isDashboard = pathname.startsWith("/dashboard");
    let targetWrapper: HTMLElement | Window = window;
    let targetContent: HTMLElement = document.documentElement;

    if (isDashboard) {
      const dashboardMain = document.getElementById("dashboard-main-scroll");
      if (dashboardMain) {
        targetWrapper = dashboardMain;
        targetContent = (dashboardMain.firstElementChild as HTMLElement) || dashboardMain;
      }
    }

    // Initialize desktop Lenis smooth wheel engine
    const lenis = new Lenis({
      wrapper: targetWrapper,
      content: targetContent,
      eventsTarget: targetWrapper,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      syncTouch: false,
      infinite: false,
      autoRaf: false,
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      overscroll: true,
    });

    lenisRef.current = lenis;
    if (typeof window !== "undefined") {
      (window as any).__lenis = lenis;
    }

    // Dedicated requestAnimationFrame loop synced with display refresh rate
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Scroll to top smoothly on route change
    lenis.scrollTo(0, { immediate: true });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      if (typeof window !== "undefined" && (window as any).__lenis === lenis) {
        delete (window as any).__lenis;
      }
    };
  }, [pathname]);

  const scrollTo = (target: string | number | HTMLElement, options?: { offset?: number; immediate?: boolean; duration?: number }) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
    } else if (typeof window !== "undefined") {
      if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: options?.immediate ? "auto" : "smooth" });
      } else if (typeof target === "string") {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth" });
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth" });
      }
    }
  };

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisRef.current, scrollTo }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
