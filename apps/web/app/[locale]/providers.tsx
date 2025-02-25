"use client";

import { AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { ReactNode, useEffect, useState } from "react";

import { clsxMerge } from "@/functions/clsxMerge";
import { Locale, routing } from "@/i18n/routing";
import DatabaseProvider from "@/providers/DatabaseProvider";
import DialogsProvider from "@/providers/DialogsProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import ToastProvider from "@/providers/ToastProvider";

type Props = {
  children: ReactNode;
  messages: AbstractIntlMessages | undefined;
  locale: Locale;
};

const timeZone = "Europe/Vienna";

export function Providers({ children, messages, locale }: Props) {
  const [loaded, setIsLoaded] = useState(false);
  const [mountPreloader, setMountPreloader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50); // Small delay to ensure initial render completes
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        setMountPreloader(false);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  return (
    <>
      {mountPreloader && (
        <>
          <div
            style={{ transitionDuration: "500ms" }}
            tabIndex={-1}
            className={clsxMerge(
              "fixed w-full h-[100vh] top-0 left-0 bottom-0 right-0 bg-global-bg z-[999]",
              loaded ? "opacity-0 pointer-events-none" : "opacity-100 ",
            )}
          />
          <svg
            className={clsxMerge(
              "fixed left-1/2 top-1/2 -translate-x-[calc(50%-9px)] md:-translate-x-[calc(50%-24px)] -translate-y-1/2 z-[1001] w-[90px] h-[102px] md:w-[172px] md:h-[195px]",
              loaded ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
            viewBox="0 0 35 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M34.7501 18.2515L3.03307 0.0595387C2.8444 -0.0379207 2.69256 -0.0166899 2.44791 0.130308L2.45524 0.123838L0.197021 1.41912C0.0494589 1.52123 0.00895552 1.67571 0 1.74708V38.0984L0.00162828 38.0885C-0.0052919 38.3346 0.0557685 38.4672 0.251772 38.5898L2.6142 39.9449C2.78435 40.0179 2.87655 40.007 3.0402 39.9172L34.7694 21.7378C34.94 21.63 34.999 21.4931 34.9998 21.2295V18.6452C34.9939 18.5673 34.9377 18.3498 34.7501 18.2515ZM21.5421 16.9281L26.9164 20.0108L21.5415 23.0935L21.5421 16.9281ZM5.44679 26.1301L10.8101 29.2045L5.44679 32.2808V26.1301ZM10.8103 10.7726L5.45127 13.8506V7.69898L10.8103 10.7726ZM5.63872 19.9892L16.091 13.994V25.9843L5.63872 19.9892Z"
              fill="#139F6D"
            />
            <path
              d="M13.4585 27.6856L10.8217 29.2112L2.79982 24.6126L2.7756 39.9875C2.71373 39.9888 2.67729 39.9722 2.6142 39.9449L0.251772 38.59C0.0557685 38.4676 -0.0052919 38.3348 0.00162828 38.0887L0 38.0986V19.9665L13.4585 27.6856ZM34.931 18.4502L21.5411 26.1137L21.5421 16.9182L18.8904 15.4072L18.8858 30.8336L34.7696 21.7378C34.9402 21.63 34.9992 21.4931 35 21.2292V18.6452C34.9935 18.56 34.9666 18.5111 34.931 18.4502ZM3.03307 0.0595387C2.8444 -0.0379206 2.69256 -0.0166899 2.44791 0.130308L2.45524 0.123838L0.197021 1.41912C0.136165 1.46259 0.0903693 1.5095 0.0582109 1.5647L13.4591 9.25105L5.44536 13.8541L5.45127 16.8846L18.9098 9.16572L3.03307 0.0595387Z"
              fill="#088457"
            />
            <path
              d="M34.9465 18.444L21.5411 26.1115L21.5415 23.0913L29.5675 18.4879L16.1091 10.7692L18.9084 9.16352L34.7499 18.2495C34.8443 18.3077 34.9072 18.3696 34.9465 18.444ZM0.0584144 1.5625C0.0282913 1.61446 0.00895552 1.67351 0 1.74488V19.9641L2.79962 21.5769V6.17544L10.8284 10.7708L13.4593 9.24865L0.0584144 1.5625ZM5.42786 35.3386L5.44658 26.1279L2.79962 24.6104L2.77723 39.9983C2.85254 39.9971 2.9311 39.9738 3.02127 39.93L18.8866 30.8308V27.6195L5.42786 35.3386Z"
              fill="#70C59E"
            />
          </svg>
          <div
            className={clsxMerge(
              "main-loader fixed top-1/2 left-1/2 z-[1000]",
              loaded ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          />
        </>
      )}
      <DatabaseProvider>
        <NextIntlClientProvider locale={locale} timeZone={timeZone} messages={messages}>
          <ThemeProvider attribute="class">
            <ToastProvider>
              <DialogsProvider>{children}</DialogsProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </DatabaseProvider>
    </>
  );
}
