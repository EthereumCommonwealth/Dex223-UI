import React from "react";

import Svg from "@/components/atoms/Svg";

export function YoutubeTag() {
  return (
    <span className="absolute bottom-5 left-5 bg-black/70 rounded-2 text-secondary-text px-3 h-8 md:h-10 z-10 flex items-center gap-2 text-14 md:text-16">
      <Svg iconName="youtube" className="text-tertiary-text !w-5 !h-5 md:!w-6 md:!h-6" />
      Video
    </span>
  );
}

export function CategoryTag({ tag }: { tag: string }) {
  return (
    <span className="absolute top-5 left-5 rounded-2 text-secondary-text px-3 h-8 md:h-10 z-10 flex items-center gap-2 bg-secondary-bg border border-secondary-border text-14 md:text-16">
      {tag}
    </span>
  );
}
