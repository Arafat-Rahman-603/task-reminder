"use client";

import { useEffect, useState } from "react";
import { type TimeOfDay, getTimeOfDay, getGreetingText, getGreetingTitle } from "@/lib/greeting";

export function MorningSunSvg() {
  return (
    <span className="animate-sun-glow inline-flex items-center justify-center align-middle shrink-0 mr-1" title={getGreetingTitle("morning")}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-[0_1px_3px_rgba(245,158,11,0.35)]" aria-hidden="true">
        <defs>
          <radialGradient id="morningSunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="4.2" fill="url(#morningSunGrad)" stroke="#F59E0B" strokeWidth="1.2" />
        <path d="M12 2.5V4.8M12 19.2V21.5M2.5 12H4.8M19.2 12H21.5M5.28 5.28L6.9 6.9M17.1 17.1L18.72 18.72M5.28 18.72L6.9 17.1M17.1 6.9L18.72 5.28" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function AfternoonSunSvg() {
  return (
    <span className="animate-sun-glow inline-flex items-center justify-center align-middle shrink-0 mr-1" title={getGreetingTitle("afternoon")}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-[0_1px_4px_rgba(251,191,36,0.45)]" aria-hidden="true">
        <defs>
          <radialGradient id="afternoonSunCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="45%" stopColor="#FDE047" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
          <linearGradient id="afternoonRayGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        {/* Soft outer halo */}
        <circle cx="12" cy="12" r="7.4" stroke="#FBBF24" strokeWidth="0.8" strokeDasharray="1.5 2" opacity="0.6" />
        {/* Core sun disc */}
        <circle cx="12" cy="12" r="4.6" fill="url(#afternoonSunCore)" stroke="#F59E0B" strokeWidth="1.2" />
        {/* Cardinal and diagonal energetic rays */}
        <path d="M12 1.8V4.2M12 19.8V22.2M1.8 12H4.2M19.8 12H22.2M4.78 4.78L6.5 6.5M17.5 17.5L19.22 19.22M4.78 19.22L6.5 17.5M17.5 6.5L19.22 4.78" stroke="url(#afternoonRayGrad)" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function EveningDuskSvg() {
  return (
    <span className="animate-sunset-glow inline-flex items-center justify-center align-middle shrink-0 mr-1" title={getGreetingTitle("evening")}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-[0_1px_4px_rgba(249,115,22,0.45)]" aria-hidden="true">
        <defs>
          <linearGradient id="eveningSunGrad" x1="12" y1="4" x2="12" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="45%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="eveningHorizonGrad" x1="2" y1="16" x2="22" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FB923C" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Setting sun disc dipping into horizon */}
        <path d="M6.5 15A5.5 5.5 0 0 1 17.5 15" fill="url(#eveningSunGrad)" stroke="#FB923C" strokeWidth="1.2" strokeLinecap="round" />
        {/* Twilight sun rays fan */}
        <path d="M12 4.5V6.5M7.4 7.4L8.8 8.8M16.6 7.4L15.2 8.8M4.5 12H6.5M17.5 12H19.5" stroke="#FB923C" strokeWidth="1.6" strokeLinecap="round" />
        {/* Twilight horizon ripples */}
        <path d="M3 16H21" stroke="url(#eveningHorizonGrad)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 19H18" stroke="#F43F5E" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
        <path d="M9 21.5H15" stroke="#A855F7" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      </svg>
    </span>
  );
}

export function NightMoonSvg() {
  return (
    <span className="animate-moon-glow inline-flex items-center justify-center align-middle shrink-0 mr-1" title={getGreetingTitle("night")}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-[0_1px_4px_rgba(56,189,248,0.45)]" aria-hidden="true">
        <defs>
          <linearGradient id="nightMoonGrad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F0F9FF" />
            <stop offset="40%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <radialGradient id="starGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>
        {/* Crescent Moon */}
        <path
          d="M17.5 14.5A7.5 7.5 0 0 1 8.8 3.2 8.5 8.5 0 1 0 19.8 14.2c-.75.2-1.52.3-2.3.3z"
          fill="url(#nightMoonGrad)"
          stroke="#38BDF8"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        {/* Sparkle Diamond Star */}
        <path
          d="M18.5 4.5L19.2 6.5L21.2 7.2L19.2 7.9L18.5 9.9L17.8 7.9L15.8 7.2L17.8 6.5Z"
          fill="url(#starGlowGrad)"
          stroke="#F59E0B"
          strokeWidth="0.4"
        />
        {/* Micro Star Accents */}
        <circle cx="14" cy="9" r="0.85" fill="#7DD3FC" />
        <circle cx="6.5" cy="17" r="0.6" fill="#38BDF8" opacity="0.75" />
      </svg>
    </span>
  );
}

export function GreetingIcon({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  switch (timeOfDay) {
    case "morning":
      return <MorningSunSvg />;
    case "afternoon":
      return <AfternoonSunSvg />;
    case "evening":
      return <EveningDuskSvg />;
    case "night":
      return <NightMoonSvg />;
  }
}

interface DashboardGreetingProps {
  initialTimeOfDay?: TimeOfDay;
}

export function DashboardGreeting({ initialTimeOfDay = "morning" }: DashboardGreetingProps) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(initialTimeOfDay);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateGreeting = () => {
      setTimeOfDay(getTimeOfDay());
    };

    updateGreeting();

    // Check periodically every minute so transitions occur in real time
    const interval = setInterval(updateGreeting, 60000);

    // Refresh immediately if the tab becomes visible or wakes up
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateGreeting();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const activePeriod = mounted ? timeOfDay : initialTimeOfDay;

  return (
    <span className="inline-flex items-center gap-2 text-on-surface" suppressHydrationWarning>
      <GreetingIcon timeOfDay={activePeriod} />
      <span>{getGreetingText(activePeriod)}</span>
    </span>
  );
}
