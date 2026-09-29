"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { ReactNode } from "react";

import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor } from "@/components/buttons/Button";
import { Link } from "@/i18n/routing";

function ListingVariantCard({
  href,
  isExternal,
  image,
  heading,
  paragraphText,
  buttonText,
}: {
  href: string;
  isExternal: boolean;
  image: string;
  heading: string;
  paragraphText: ReactNode;
  buttonText: string;
}) {
  return (
    <div className="px-4 md:px-5 pb-4 md:pb-5 pt-6 bg-primary-bg flex flex-col rounded-5">
      <div className="flex-grow flex flex-col">
        <Image src={image} alt="" width={320} height={170} className="mb-6 mx-auto" />
        <h3 className="mb-1 text-16 md:text-24 font-medium">{heading}</h3>
        <p className="text-14 md:text-14 mb-4 text-secondary-text">{paragraphText}</p>
      </div>

      {isExternal ? (
        <a target="_blank" rel="noopener noreferrer" href={href}>
          <Button fullWidth colorScheme={ButtonColor.LIGHT_GREEN} endIcon="forward">
            {buttonText}
          </Button>
        </a>
      ) : (
        <Link href={href}>
          <Button fullWidth colorScheme={ButtonColor.LIGHT_GREEN} endIcon="next">
            {buttonText}
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function TokenListingPage() {
  const t = useTranslations("TokenListing");
  const tManage = useTranslations("ManageTokens");

  return (
    <>
      <Container>
        <div className="md:py-5 py-4">
          <h1 className="mb-3 text-24 lg:text-40">{t("title")}</h1>
          <p className="text-14 text-secondary-text">{t("intro")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
          <ListingVariantCard
            heading={t("default_heading")}
            paragraphText={
              <>
                <span className="mb-2 block">{t("default_p1")}</span>
                {t("default_p2")}
              </>
            }
            href="https://github.com/EthereumCommonwealth/Dex223-listings"
            image="/images/listing-cards/default-listing.png"
            isExternal
            buttonText={tManage("apply")}
          />
          <ListingVariantCard
            heading={t("autolisting_heading")}
            paragraphText={
              <>
                <span className="mb-2 block">{t("autolisting_p1")}</span>
                {t("autolisting_p2")}
              </>
            }
            href="/token-listing/contracts"
            image="/images/listing-cards/automatic-listing.png"
            isExternal={false}
            buttonText={tManage("apply")}
          />
          <ListingVariantCard
            heading={t("existing_heading")}
            paragraphText={
              <>
                <span className="block mb-2">
                  {t.rich("existing_p1", {
                    link: (chunks) => (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green underline hocus:text-green-hover duration-200"
                        href="https://tokenlists.org/"
                      >
                        {chunks}
                        <Svg
                          iconName="forward"
                          size={16}
                          aria-hidden
                          className="inline-block align-[-3px] ml-0.5"
                        />
                      </a>
                    ),
                  })}
                </span>
                {t("existing_p2")}
              </>
            }
            href="https://tokenlists.org/"
            image="/images/listing-cards/existing-listing.png"
            isExternal={true}
            buttonText={t("view_uniswap_lists")}
          />
        </div>
      </Container>
    </>
  );
}
