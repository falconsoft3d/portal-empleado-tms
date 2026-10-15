"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

function now() {
  return new Date().toLocaleTimeString("es-ES", { hour12: false });
}

export function LiveClock({ className }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, now, () => "--:--:--");
  return (
    <span className={className} suppressHydrationWarning>
      {time}
    </span>
  );
}
