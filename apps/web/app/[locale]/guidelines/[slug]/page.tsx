import clsx from "clsx";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React, { ReactNode } from "react";

import GuideCta from "@/app/[locale]/guidelines/components/GuideCta";
import { getGuide, isGuideSlug } from "@/app/[locale]/guidelines/guides";
import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import { Link } from "@/i18n/routing";

type Section = { heading: string; body?: string; items?: Record<string, string> };

const bold = (chunks: ReactNode) => (
  <strong className="text-primary-text font-medium">{chunks}</strong>
);

export default async function GuidelineArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isGuideSlug(slug)) {
    notFound();
  }
  const guide = getGuide(slug);
  if (!guide) {
    notFound();
  }

  // Rendered from messages with the app's own components. The previous MDX renderer
  // (next-mdx-remote) produced React 18 elements inside Next 15's server renderer, which
  // made every guide page fail with a 500.
  const typed = await getTranslations("Guidelines");
  // Guide keys are built from the slug at runtime, so they can't be checked statically.
  const t = typed as unknown as {
    (key: string): string;
    rich: (key: string, values: Record<string, (chunks: ReactNode) => ReactNode>) => ReactNode;
    raw: (key: string) => unknown;
  };
  const base = `guides.${slug}`;
  const sections = t.raw(`${base}.sections`) as Record<string, Section>;

  return (
    <Container>
      <div className="md:py-8 py-5 max-w-3xl">
        <Link
          href="/guidelines"
          className="inline-flex items-center gap-1 min-h-11 text-14 text-green hocus:text-green-hover duration-200 mb-2"
        >
          <Svg iconName="back" size={20} />
          {t("back")}
        </Link>

        <div className="flex items-center gap-4 mb-3">
          <span
            aria-hidden
            className="flex-shrink-0 w-12 h-12 rounded-3 flex items-center justify-center bg-green-bg text-green"
          >
            <Svg iconName={guide.icon} />
          </span>
          <h1 className="text-28 lg:text-40 font-medium">{t(`${base}.title`)}</h1>
        </div>
        <p className="text-secondary-text text-16 md:text-18 mb-6">{t(`${base}.description`)}</p>

        <div className="surface rounded-5 px-5 md:px-8 py-6 mb-6 flex flex-col gap-7">
          {Object.keys(sections).map((id) => {
            const path = `${base}.sections.${id}`;
            const items = sections[id].items ? Object.keys(sections[id].items!) : [];
            const isSteps = id === "steps";

            return (
              <section key={id}>
                <h2 className="text-18 md:text-20 font-medium text-primary-text mb-3">
                  {t(`${path}.heading`)}
                </h2>
                {sections[id].body && (
                  <p className="text-16 text-secondary-text leading-relaxed">
                    {t.rich(`${path}.body`, { b: bold })}
                  </p>
                )}
                {items.length > 0 && (
                  <ol className={clsx("flex flex-col", isSteps ? "gap-3" : "gap-2")}>
                    {items.map((key, index) => (
                      <li
                        key={key}
                        className="flex gap-3 text-16 text-secondary-text leading-relaxed"
                      >
                        {isSteps ? (
                          <span
                            aria-hidden
                            className="flex-shrink-0 w-7 h-7 mt-px rounded-full bg-green-bg text-green text-14 font-medium flex items-center justify-center"
                          >
                            {index + 1}
                          </span>
                        ) : (
                          <span
                            aria-hidden
                            className="flex-shrink-0 w-1.5 h-1.5 mt-2.5 rounded-full bg-green"
                          />
                        )}
                        <span>{t.rich(`${path}.items.${key}`, { b: bold })}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </div>

        <GuideCta href={guide.ctaHref} label={t(`${base}.cta`)} action={guide.ctaAction} />
      </div>
    </Container>
  );
}
