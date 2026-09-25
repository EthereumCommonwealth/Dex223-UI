import React from "react";

import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import { Link } from "@/i18n/routing";
import { Standard } from "@/sdk_bi/standard";

export default function ExternalConverterLink() {
  return (
    <Link
      href="/converter"
      className="flex items-center gap-1 pl-3 pr-3 md:pl-4 md:pr-5 justify-between rounded-2 bg-primary-bg border-l-4 border-l-green py-3 hocus:bg-green-bg duration-200 group text-secondary-text hocus:text-primary-text"
    >
      <div className="flex items-center gap-1 text-14 md:text-16">
        <Svg
          iconName="convert"
          className="text-tertiary-text group-hocus:text-green mr-1 flex-shrink-0 duration-200 "
        />
        Convert your{" "}
        <Badge size="small" variant={BadgeVariant.STANDARD} standard={Standard.ERC20} />
        tokens to <Badge size="small" variant={BadgeVariant.STANDARD} standard={Standard.ERC223} />
      </div>
      <div className="relative before:opacity-0 before:duration-200 group-hocus:before:opacity-40 before:absolute before:w-4 before:h-4 before:rounded-full before:bg-green-hover-icon before:blur-[8px] before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2">
        <Svg
          className="relative z-10 text-tertiary-text group-hocus:text-green-hover-icon duration-200"
          iconName="forward"
        />
      </div>
    </Link>
  );
}
