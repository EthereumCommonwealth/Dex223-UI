"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { formatGwei } from "viem";

import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import { IconName } from "@/config/types/IconName";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { linkTargetProps } from "@/functions/linkTarget";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useGlobalBlockNumber } from "@/shared/hooks/useGlobalBlockNumber";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";

type SocialLink = {
  title: any;
  href: string;
  icon: Extract<IconName, "telegram" | "x" | "discord" | "blog" | "shield">;
};

const socialLinks: SocialLink[] = [
  {
    title: "security_audit",
    href: "https://www.beosin.com/audits/Dex223_202504300959.pdf",
    icon: "shield",
  },
  {
    title: "blog",
    href: "https://blog.dex223.io/",
    icon: "blog",
  },
  {
    title: "discussions",
    href: "https://t.me/Dex223_defi",
    icon: "telegram",
  },
  {
    title: "announcements",
    href: "https://t.me/Dex_223",
    icon: "telegram",
  },
  {
    title: "x",
    href: "https://twitter.com/Dex_223",
    icon: "x",
  },
  {
    title: "discord",
    href: "https://discord.gg/t5bdeGC5Jk",
    icon: "discord",
  },
];

function FooterLink({ href, title, icon }: SocialLink) {
  const t = useTranslations("Footer");

  return (
    <>
      <a
        {...linkTargetProps(href)}
        href={href}
        className={clsx(
          "sm:w-auto text-12 xl:text-16 flex gap-2 bg-primary-bg rounded-5 xl:py-2 xl:pr-4 xl:pl-5 p-2 hocus:bg-green-bg hocus:text-primary-text text-secondary-text duration-200 w-full whitespace-nowrap justify-center items-center",
          // title === "blog" && "max-md:col-span-2",
        )}
      >
        {t(title)}
        <Svg className="!w-4 !h-4 xl:!w-6 xl:!h-6" iconName={icon} />
      </a>
    </>
  );
}

export default function Footer() {
  const t = useTranslations("Footer");

  const chainId = useCurrentChainId();

  const { gasPrice } = useGlobalFees();
  const { blockNumber } = useGlobalBlockNumber();

  return (
    <>
      <div>
        <Container gutter={false} className="max-w-[1920px]">
          <div className="py-5 px-5 flex justify-end items-center gap-2 max-lg:hidden">
            <div className="flex items-center gap-1 text-12 text-secondary-text">
              <Svg size={16} className="text-tertiary-text" iconName="gas" />
              <span>
                {t("gas")}{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green duration-200 hocus:text-green-hover"
                  href={getExplorerLink(ExplorerLinkType.GAS_TRACKER, "", chainId)}
                >
                  {gasPrice ? formatFloat(formatGwei(gasPrice)) : ""} GWEI
                </a>
              </span>
            </div>
            <div className="bg-primary-border w-[1px] h-3" />
            <div className="flex items-center gap-1.5 text-12 group relative">
              {blockNumber ? (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green duration-200 hocus:text-green-hover"
                  href={getExplorerLink(ExplorerLinkType.BLOCK, blockNumber.toString(), chainId)}
                >
                  {blockNumber.toString()}
                </a>
              ) : null}
              <div className="w-1.5 h-1.5 rounded-full bg-green" />

              <div className="z-[1000] whitespace-nowrap text-14 opacity-0 pointer-events-none px-5 py-4 absolute group-hocus:opacity-100 duration-200 bottom-9 rounded-3 right-0 bg-primary-bg border border-secondary-border before:w-2.5 before:h-2.5 before:-bottom-[6px] before:bg-primary-bg before:absolute before:right-9 before:rotate-45 before:border-secondary-border before:border-r before:border-b">
                <p>{t("most_recent_block")}</p>
                <p>{t("prices_update_on_every_block")}</p>
              </div>
            </div>
          </div>
        </Container>
      </div>
      <footer className="before:h-[1px] before:bg-gradient-to-r before:from-secondary-border/20 before:via-50% before:via-secondary-border before:to-secondary-border/20 before:w-full before:absolute relative before:top-0 before:left-0 pb-[64px] md:pb-0">
        <Container gutter={false} className="max-w-[1920px]">
          <div className="flex justify-between pt-4 pb-3 px-5 items-center flex-col-reverse sm:flex-row gap-3">
            <span className="text-12 text-secondary-text whitespace-nowrap shrink-0">
              © {new Date(Date.now()).getFullYear()} DEX223
            </span>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-end sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {socialLinks.map((socialLink) => {
                return <FooterLink key={socialLink.title} {...socialLink} />;
              })}
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
}
