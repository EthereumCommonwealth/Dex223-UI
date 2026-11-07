"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useEffect, useRef } from "react";

import CreateTokenForm from "@/app/[locale]/create-token/components/CreateTokenForm";
import { useCreateTokenRecentTransactionsStore } from "@/app/[locale]/create-token/stores/useCreateTokenRecentTransactions";
import { useRemoveRecentTransactionsStore } from "@/app/[locale]/remove/[tokenId]/stores/useRemoveLiquidityRecentTransactionsStore";
import Container from "@/components/atoms/Container";
import IconButton, { IconButtonSize } from "@/components/buttons/IconButton";
import RecentTransactions from "@/components/common/RecentTransactions";

export default function DecreaseLiquidityPage() {
  const t = useTranslations("CreateToken");
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useCreateTokenRecentTransactionsStore();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let frame = 0;
    let previousMargin = -1;
    let previousViewportHeight = -1;

    const keepActionsVisible = () => {
      const notificationHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--bottom-notifications-height",
          ),
        ) || 0;
      const margin = parseFloat(getComputedStyle(card).scrollMarginBottom);
      const viewportHeight = window.innerHeight;

      if (margin === previousMargin && viewportHeight === previousViewportHeight) return;
      previousMargin = margin;
      previousViewportHeight = viewportHeight;

      if (
        notificationHeight > 0 &&
        !card.contains(document.activeElement) &&
        card.getBoundingClientRect().bottom > viewportHeight - margin
      ) {
        card.scrollIntoView({ block: "end", behavior: "instant" });
      }
    };

    const scheduleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(keepActionsVisible);
    };

    // BottomNotifications measures after mount and whenever its warning content changes.
    const observer = new MutationObserver(scheduleScroll);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    window.addEventListener("resize", scheduleScroll);
    scheduleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <Container>
      <div
        className={clsx(
          "grid py-4 lg:py-10 grid-cols-1 mx-auto",
          showRecentTransactions
            ? "xl:grid-cols-[580px_600px] xl:max-w-[1200px] gap-4 xl:grid-areas-[left_right] grid-areas-[right,left]"
            : "xl:grid-cols-[600px] xl:max-w-[600px] grid-areas-[right]",
        )}
      >
        <div className="grid-in-[left] flex justify-center">
          <div className="w-full sm:max-w-[600px] xl:max-w-full mx-auto">
            <RecentTransactions
              showRecentTransactions={showRecentTransactions}
              handleClose={() => setShowRecentTransactions(false)}
              store={useRemoveRecentTransactionsStore}
            />
          </div>
        </div>

        <div>
          <div
            ref={cardRef}
            className="lg:w-[600px] bg-primary-bg mx-auto card-spacing rounded-5 scroll-mb-[calc(var(--bottom-notifications-height,0px)+80px)] md:scroll-mb-[calc(var(--bottom-notifications-height,0px)+16px)]"
          >
            <div className="flex justify-between py-1.5 -mr-3">
              <h1 className="text-18 lg:text-20 font-bold flex justify-center items-center text-nowrap">
                {t("title")}
              </h1>
              <div className="flex items-center gap-2 justify-end">
                <IconButton
                  onClick={() => setShowRecentTransactions(!showRecentTransactions)}
                  buttonSize={IconButtonSize.LARGE}
                  iconName="recent-transactions"
                  active={showRecentTransactions}
                />
              </div>
            </div>
            <div className="rounded-b-2 bg-primary-bg">
              <CreateTokenForm />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
