"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { clsxMerge } from "@/functions/clsxMerge";

type Props = {
  flowTitle: string;
  stepNumber: number;
  total: number;
  title: string;
  body: string;
  tip?: string;
  nextLabel: string;
  nextDisabled: boolean;
  onBack?: () => void;
  onNext: () => void;
};

function Progress({ stepNumber, total }: { stepNumber: number; total: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={clsxMerge(
            "h-2 rounded-full",
            i + 1 === stepNumber ? "w-6" : "w-2",
            i + 1 <= stepNumber ? "bg-green" : "bg-tertiary-bg",
          )}
        />
      ))}
    </div>
  );
}

function Actions({
  nextLabel,
  nextDisabled,
  onBack,
  onNext,
}: Omit<Props, "flowTitle" | "stepNumber" | "total" | "title" | "body" | "tip">) {
  const t = useTranslations("Demo");
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        size={ButtonSize.MEDIUM}
        colorScheme={ButtonColor.LIGHT_GREEN}
        disabled={!onBack}
        onClick={onBack}
      >
        {t("back")}
      </Button>
      <Button size={ButtonSize.MEDIUM} disabled={nextDisabled} onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
}

// Desktop: a card beside the simulated screen. Below lg: a bottom sheet above the app's
// fixed mobile bar, collapsible to its title row.
export default function CoachPanel(props: Props) {
  const t = useTranslations("Demo");
  const { flowTitle, stepNumber, total, title, body, tip } = props;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        aria-live="polite"
        className="max-lg:hidden w-[400px] flex-shrink-0 sticky top-5 bg-primary-bg rounded-5 p-5 flex flex-col gap-4 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-14 font-medium text-secondary-text">{flowTitle}</span>
          <span className="text-12 rounded-full border border-secondary-border px-2 py-0.5 text-secondary-text whitespace-nowrap">
            {t("step_of", { current: stepNumber, total })}
          </span>
        </div>
        <h2 className="text-20 font-bold">{title}</h2>
        <p className="text-secondary-text">{body}</p>
        {tip && (
          <p className="flex gap-2 rounded-3 bg-green-bg p-3 text-14">
            <Svg iconName="check" size={20} className="text-green flex-shrink-0" />
            {tip}
          </p>
        )}
        <Progress stepNumber={stepNumber} total={total} />
        <Actions {...props} />
      </aside>

      <aside
        aria-live="polite"
        className="lg:hidden fixed inset-x-0 bottom-[64px] md:bottom-0 z-[86] bg-primary-bg rounded-t-5 px-4 pt-2 pb-4 flex flex-col gap-3 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.8)]"
      >
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex flex-col items-center gap-2 w-full"
          aria-expanded={!collapsed}
          aria-label={collapsed ? t("show_coach") : t("hide_coach")}
        >
          <span className="h-1 w-10 rounded-full bg-tertiary-bg" />
          <span className="flex w-full items-center justify-between gap-3 text-left">
            <span className="text-18 font-bold">{title}</span>
            <span className="text-12 rounded-full border border-secondary-border px-2 py-0.5 text-secondary-text whitespace-nowrap">
              {t("step_short", { current: stepNumber, total })}
            </span>
          </span>
        </button>
        {!collapsed && (
          <>
            <p className="text-14 text-secondary-text">{body}</p>
            <Actions {...props} />
          </>
        )}
      </aside>
    </>
  );
}
