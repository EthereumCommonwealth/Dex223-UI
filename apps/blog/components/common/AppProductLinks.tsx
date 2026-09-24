"use client";

import { useLocale, useTranslations } from "next-intl";

import { MobileLink } from "@/components/common/MobileMenu";
import { useFeedbackDialogStore } from "@/components/dialogs/stores/useFeedbackDialogStore";
import { useRouter } from "@/i18n/routing";

/**
 * The "More" menu's product items, kept in step with the app's More menu. Everything except
 * Blog and Feedback lives in the app, so those items open the app in the visitor's language
 * (same tab: first-party). Token lists is a dialog that only exists inside the app, so it goes
 * to the app's Token lists guide, whose button opens that dialog.
 */
export default function AppProductLinks({
  handleClose,
  className = "pr-5",
  withFeedback = true,
}: {
  handleClose: () => void;
  className?: string;
  /** The mobile menu has its own Feedback button, so it leaves this out. */
  withFeedback?: boolean;
}) {
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const router = useRouter();
  const { setIsOpen: setFeedbackOpen } = useFeedbackDialogStore();
  const app = `${process.env.NEXT_PUBLIC_DAPP_URL}/${locale}`;

  return (
    <>
      <MobileLink
        href={`${app}/converter`}
        iconName="convert"
        title={t("app_token_converter")}
        handleClose={handleClose}
        className={className}
      />
      <MobileLink
        href={`${app}/guidelines/token-lists`}
        iconName="list"
        title={t("app_token_lists")}
        handleClose={handleClose}
        className={className}
      />
      <MobileLink
        href={`${app}/statistics`}
        iconName="statistics"
        title={t("app_statistics")}
        handleClose={handleClose}
        className={className}
      />
      <MobileLink
        href={`${app}/guidelines`}
        iconName="guidelines"
        title={t("app_guidelines")}
        handleClose={handleClose}
        className={className}
      />
      <MobileLink
        href={`/${locale}`}
        iconName="blog"
        title={t("app_blog")}
        handleClick={(e) => {
          e.preventDefault();
          router.push("/");
        }}
        handleClose={handleClose}
        className={className}
      />
      {withFeedback && (
        <MobileLink
          href="#"
          iconName="star"
          title={t("app_feedback")}
          handleClick={(e) => {
            e.preventDefault();
            setFeedbackOpen(true);
          }}
          handleClose={handleClose}
          className={className}
        />
      )}
    </>
  );
}
