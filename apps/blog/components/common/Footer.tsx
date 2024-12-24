"use client";

import { useTranslations } from "next-intl";

import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import { IconName } from "@/config/types/IconName";

type SocialLink = {
  title: any;
  href: string;
  icon: Extract<IconName, "telegram" | "x" | "discord">;
};

const socialLinks: SocialLink[] = [
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
        target="_blank"
        href={href}
        className="lg:w-auto flex gap-2 bg-primary-bg rounded-5 py-2 pr-4 pl-5 hocus:bg-green-bg hocus:text-primary-text text-secondary-text duration-200 w-full whitespace-nowrap justify-center"
      >
        {t(title)}
        <Svg iconName={icon} />
      </a>
    </>
  );
}

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <>
      <footer className="before:h-[1px] before:bg-gradient-to-r before:from-secondary-border/20 before:via-50% before:via-secondary-border before:to-secondary-border/20 before:w-full before:absolute relative before:top-0 before:left-0 pb-[56px] md:pb-0">
        <Container>
          <div className="flex justify-between py-3 px-5 items-center flex-col-reverse lg:flex-row gap-3">
            <span className="text-12 text-secondary-text max-md:mb-3">
              © {new Date(Date.now()).getFullYear()} DEX223
            </span>
            <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-3 w-full lg:w-auto">
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
