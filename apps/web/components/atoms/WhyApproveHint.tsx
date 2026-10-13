import Tooltip from "@repo/ui/tooltip";
import { useTranslations } from "next-intl";

import { clsxMerge } from "@/functions/clsxMerge";

// "Why do I have to approve a token?" under an Approve step. Hover, focus or tap shows the answer.
export default function WhyApproveHint({ className }: { className?: string }) {
  const t = useTranslations("Swap");

  return (
    <Tooltip
      text={t("why_do_i_have_to_approve_answer")}
      renderTrigger={(ref, refProps) => (
        <span
          ref={ref.setReference}
          {...refProps}
          tabIndex={0}
          onClick={(e) => e.stopPropagation()}
          className={clsxMerge(
            "text-green text-12 w-fit cursor-help underline decoration-dotted underline-offset-2 hover:text-green-hover rounded-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-hover",
            className,
          )}
        >
          {t("why_do_i_have_to_approve")}
        </span>
      )}
    />
  );
}
