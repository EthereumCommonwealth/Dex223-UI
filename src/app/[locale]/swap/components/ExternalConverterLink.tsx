import React from "react";
import { useMediaQuery } from "react-responsive";

import Svg from "@/components/atoms/Svg";
import Badge from "@/components/badges/Badge";

export default function ExternalConverterLink() {
  const isMobile = useMediaQuery({ query: "(max-width: 640px)" });

  return (
    <a
      target="_blank"
      href="https://gorbatiukcom.github.io/token-converter/"
      className="flex items-center gap-1 pl-3 pr-3 md:pl-4 md:pr-5 justify-between rounded-2 bg-primary-bg border-l-4 border-l-green py-3 hover:bg-green-bg focus:outline-0 focus:bg-green-bg duration-200 group text-secondary-text hover:text-primary-text focus:text-primary-text"
    >
      <div className="flex items-center gap-1 text-14 md:text-16">
        <Svg
          iconName="convert"
          className="text-tertiary-text group-hover:text-green group-focus:outline-0 group-focus:text-green mr-1 flex-shrink-0"
        />
        Convert your <Badge size={isMobile ? "small" : undefined} text="ERC-20" /> tokens to{" "}
        <Badge size={isMobile ? "small" : undefined} text="ERC-223" />
      </div>
      <div className="relative before:opacity-0 before:duration-200 group-hover:before:opacity-40 group-focus:before:opacity-40 group-focus:before:outline-0 before:absolute before:w-4 before:h-4 before:rounded-full before:bg-green-hover-icon before:blur-[8px] before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2">
        <Svg
          className="relative z-10 text-tertiary-text group-hover:text-green-hover-icon group-focus:text-green-hover group-focus:outline-0 duration-200"
          iconName="forward"
        />
      </div>
    </a>
  );
}
