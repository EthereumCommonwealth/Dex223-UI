import React, { SVGProps } from "react";

import { IconName } from "@/config/types/IconName";

interface Props extends SVGProps<SVGSVGElement> {
  iconName: IconName;
  sprite?: "sprite" | "social";
  size?: number;
  style?: React.CSSProperties;
}

export default function Svg({ iconName, size = 24, style, sprite = "sprite", ...rest }: Props) {
  const iconPath = `/images/${sprite}.svg#${iconName}`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      {...rest}
    >
      <use xlinkHref={`/images/${sprite}.svg#${iconName}`} />
    </svg>
  );
}
