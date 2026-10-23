"use client";

import { PropsWithChildren, useEffect, useRef } from "react";

export default function BottomNotifications({ children }: PropsWithChildren) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      document.documentElement.style.setProperty(
        "--bottom-notifications-height",
        `${element.offsetHeight}px`,
      );
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.documentElement.style.removeProperty("--bottom-notifications-height");
    };
  }, []);

  return (
    <div ref={ref} className="fixed bottom-[64px] md:bottom-0 left-0 z-[1000] w-full flex flex-col">
      {children}
    </div>
  );
}
