"use client";

import { useTranslations } from "next-intl";

import Svg from "@/components/atoms/Svg";
import Button, { ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import { Link, useRouter } from "@/i18n/routing";

import { DemoFlow, nextUnfinishedFlow } from "../flows";
import { useHydratedDemoStore } from "../stores/useDemoStore";

export default function DemoCompletion({ flow }: { flow: DemoFlow }) {
  const t = useTranslations("Demo");
  const router = useRouter();
  const { completed } = useHydratedDemoStore();
  const next = nextUnfinishedFlow(completed, flow.id);

  return (
    <div className="py-10 lg:py-16 flex justify-center">
      <div className="w-full max-w-[600px] bg-primary-bg rounded-5 p-6 md:p-8 flex flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-green-bg p-4 text-green">
          <Svg iconName="success" size={40} />
        </span>
        <h1 className="text-24 md:text-32 font-bold">
          {t("complete_title", { flow: t(`flows.${flow.id}.short`) })}
        </h1>
        <p className="text-secondary-text max-w-[520px]">{t(`flows.${flow.id}.complete_text`)}</p>
        <div className="grid sm:grid-cols-2 gap-3 w-full">
          <Button
            variant={ButtonVariant.OUTLINED}
            size={ButtonSize.LARGE}
            onClick={() => router.push(flow.liveHref)}
          >
            {t("try_for_real")}
          </Button>
          <Button
            size={ButtonSize.LARGE}
            onClick={() => router.push(next ? `/demo/${next.id}` : "/demo")}
          >
            {next ? t("next_flow", { flow: t(`flows.${next.id}.short`) }) : t("back_to_hub")}
          </Button>
        </div>
        {next && (
          <Link href="/demo" className="text-green hocus:text-green-hover duration-200 font-medium">
            {t("back_to_hub")}
          </Link>
        )}
      </div>
    </div>
  );
}
