"use client";

import Image from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/images/tokens/placeholder.svg";

// Logo URLs that already failed. Kept across mounts so polling refetches and
// tab switches do not retry a missing logo and flash between broken and placeholder.
const failedLogos = new Set<string>();

export default function TokenLogo({
  src,
  alt,
  size,
  className,
}: {
  src?: string | null;
  alt: string;
  size: number;
  className?: string;
}) {
  const [, setFailedCount] = useState(0);
  const current = src && !failedLogos.has(src) ? src : PLACEHOLDER;

  return (
    <Image
      src={current}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => {
        if (current === PLACEHOLDER) return;
        failedLogos.add(current);
        setFailedCount((n) => n + 1);
      }}
    />
  );
}
