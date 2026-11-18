import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
} from "@floating-ui/react";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { ReactNode, useState } from "react";
import { getAddress } from "viem";

import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import { networkInfo } from "@/config/networks";
import { IconName } from "@/config/types/IconName";
import { copyToClipboard } from "@/functions/copyToClipboard";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { freeListId, TokenTrust, TrustLevel, TrustReason } from "@/functions/tokenTrust";
import truncateMiddle from "@/functions/truncateMiddle";
import addToast from "@/other/toast";
import { DexChainId } from "@/sdk_bi/chains";
import { Token } from "@/sdk_bi/entities/token";
import { Standard } from "@/sdk_bi/standard";

// Trust/Badge, Trust/Row marker, Trust/Address and Trust/Popover from Figma page "31 Token trust
// and safety" (#140). The level comes from getTokenTrust() (functions/tokenTrust.ts); there is no
// numeric score any more.

const levelIcon: Record<TrustLevel, IconName> = {
  high: "high-trust",
  medium: "medium-trust",
  low: "low-trust",
};

const levelColors: Record<TrustLevel, string> = {
  high: "bg-green-bg text-green",
  medium: "bg-orange-bg text-orange",
  low: "bg-red-bg text-red-light",
};

const reasonLabelKey: Record<
  TrustReason,
  "official" | "core_listed" | "not_verified" | "lookalike"
> = {
  official: "official",
  core: "core_listed",
  unverified: "not_verified",
  lookalike: "lookalike",
};

function checksum(address: string) {
  try {
    return getAddress(address);
  } catch {
    return address;
  }
}

/** Contract address with Copy and Open in explorer. Both buttons stop the click (a row is never picked). */
export function TrustAddress({
  address,
  chainId,
  full = false,
  danger = false,
  showExplorer = true,
  chars = 6,
  className,
}: {
  address: string;
  chainId: DexChainId;
  full?: boolean;
  /** Characters kept at each end when not `full` (6 + 6 in rows, 12 + 12 in mobile dialogs). */
  chars?: number;
  danger?: boolean;
  showExplorer?: boolean;
  className?: string;
}) {
  const t = useTranslations("TrustRating");
  const value = checksum(address);

  return (
    <span className={clsx("inline-flex items-center gap-1.5 min-w-0", className)}>
      <span
        className={clsx(
          "text-14",
          full ? "break-all" : "whitespace-nowrap",
          danger ? "text-red-light" : "text-secondary-text",
        )}
      >
        {full ? value : truncateMiddle(value, { charsFromStart: chars, charsFromEnd: chars })}
      </span>
      <Tooltip
        text={t("copy_address")}
        renderTrigger={(ref, refProps) => (
          <button
            type="button"
            ref={ref.setReference}
            {...refProps}
            aria-label={t("copy_address")}
            onClick={async (e) => {
              e.stopPropagation();
              await copyToClipboard(value);
              addToast(t("address_copied"));
            }}
            className="flex-shrink-0 flex items-center justify-center text-tertiary-text hocus:text-primary-text duration-200 max-md:w-8 max-md:h-8 max-md:-m-2"
          >
            <Svg size={16} iconName="copy" />
          </button>
        )}
      />
      {showExplorer && (
        <Tooltip
          text={t("open_in_explorer")}
          renderTrigger={(ref, refProps) => (
            <a
              ref={ref.setReference}
              {...refProps}
              href={getExplorerLink(ExplorerLinkType.ADDRESS, value, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("open_in_explorer")}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 flex items-center text-tertiary-text hocus:text-primary-text duration-200"
            >
              <Svg size={16} iconName="etherscan" />
            </a>
          )}
        />
      )}
    </span>
  );
}

function useTrustPopover() {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top",
    whileElementsMounted: autoUpdate,
    // Above the tag; below it when there is no room (Figma 180:646).
    middleware: [offset(8), flip({ fallbackPlacements: ["bottom"] }), shift({ padding: 8 })],
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 200, close: 200 },
  });

  // Hover (mouse), keyboard focus and tap (touch) open it; Esc and a click or tap outside close it.
  // safePolygon keeps it open while the pointer moves into it, so its Copy buttons can be used.
  const hover = useHover(context, { move: false, handleClose: safePolygon() });
  const focus = useFocus(context);
  const click = useClick(context, { ignoreMouse: true });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  return {
    setReference: refs.setReference,
    referenceProps: getReferenceProps({
      // Never pick the select-token row (or submit a form) when the tag is clicked or tapped.
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    }),
    popover: (content: ReactNode) => (
      <FloatingPortal>
        {isMounted && (
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, ...transitionStyles }}
            {...getFloatingProps({ onClick: (e: React.MouseEvent) => e.stopPropagation() })}
            className="z-[100]"
          >
            {content}
          </div>
        )}
      </FloatingPortal>
    ),
  };
}

function BadgeContent({ trust }: { trust: TokenTrust<Token> }) {
  const t = useTranslations("TrustRating");
  return (
    <>
      <Svg size={16} iconName={levelIcon[trust.level]} className="flex-shrink-0" />
      <span className="whitespace-nowrap">{t(reasonLabelKey[trust.reason])}</span>
      <Svg size={16} iconName="info" className="flex-shrink-0" />
    </>
  );
}

/** Trust/Badge: hover, focus or tap opens Trust/Popover. Native coins have no badge. */
export default function TrustBadge({
  token,
  trust,
  className,
}: {
  token: Token;
  trust: TokenTrust<Token> | undefined;
  className?: string;
}) {
  const { setReference, referenceProps, popover } = useTrustPopover();
  if (!trust) return null;

  return (
    <>
      <button
        type="button"
        ref={setReference}
        {...referenceProps}
        className={clsx(
          "inline-flex items-center gap-1 rounded-5 pl-2 pr-1.5 py-1 text-12 font-medium cursor-pointer flex-shrink-0",
          levelColors[trust.level],
          className,
        )}
      >
        <BadgeContent trust={trust} />
      </button>
      {popover(<TrustPopover token={token} trust={trust} />)}
    </>
  );
}

/**
 * Trust/Row marker, after the token name in select-token rows: Official and Lookalike are text
 * tags, Not verified is the round orange marker, Core listed rows show nothing.
 */
export function TrustRowMarker({
  token,
  trust,
}: {
  token: Token;
  trust: TokenTrust<Token> | undefined;
}) {
  const t = useTranslations("TrustRating");
  const { setReference, referenceProps, popover } = useTrustPopover();
  if (!trust || trust.reason === "core") return null;

  return (
    <>
      <button
        type="button"
        ref={setReference}
        {...referenceProps}
        aria-label={t(reasonLabelKey[trust.reason])}
        className={clsx(
          "inline-flex items-center flex-shrink-0 cursor-pointer text-12 font-medium",
          trust.reason === "unverified"
            ? "rounded-5 p-0.5"
            : "rounded-1 gap-0.5 pl-1 pr-1.5 py-0.5",
          levelColors[trust.level],
        )}
      >
        {trust.reason === "unverified" ? (
          <Svg size={16} iconName="warning" />
        ) : (
          <>
            <Svg size={14} iconName={levelIcon[trust.level]} />
            <span className="whitespace-nowrap">{t(reasonLabelKey[trust.reason])}</span>
          </>
        )}
      </button>
      {popover(<TrustPopover token={token} trust={trust} />)}
    </>
  );
}

type CheckKind = "pass" | "fail" | "info";

function CheckLine({ kind, children }: { kind: CheckKind; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Svg
        size={20}
        iconName={kind === "pass" ? "check" : kind === "fail" ? "close" : "info"}
        className={clsx(
          "flex-shrink-0",
          kind === "fail"
            ? "text-red-light"
            : kind === "pass"
              ? "text-secondary-text"
              : "text-tertiary-text",
        )}
      />
      <span
        className={clsx("text-14", kind === "info" ? "text-secondary-text" : "text-primary-text")}
      >
        {children}
      </span>
    </div>
  );
}

function ContractLine({
  standard,
  address,
  chainId,
}: {
  standard: Standard;
  address: string;
  chainId: DexChainId;
}) {
  const t = useTranslations("TrustRating");
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-14 text-secondary-text">
        {t("contract")}
        <Badge size="small" variant={BadgeVariant.STANDARD} standard={standard} />
      </span>
      <TrustAddress address={address} chainId={chainId} />
    </div>
  );
}

/** Trust/Popover: level, one-line reason, checks, official address for lookalikes, both contracts. */
export function TrustPopover({ token, trust }: { token: Token; trust: TokenTrust<Token> }) {
  const t = useTranslations("TrustRating");
  const chainId = token.chainId as DexChainId;
  const network = networkInfo[chainId]?.name ?? "";
  const official = trust.official;
  const officialSymbol = official?.symbol ?? "";
  const onlyInFree = trust.alsoIn.length === 1 && trust.alsoIn[0] === freeListId(chainId);
  const inFree = trust.alsoIn.includes(freeListId(chainId));
  const match = trust.match ?? "name_and_symbol";

  const levels: TrustLevel[] = ["low", "medium", "high"];
  const levelText: Record<TrustLevel, string> = {
    low: t("level_low"),
    medium: t("level_medium"),
    high: t("level_high"),
  };

  const title: Record<TrustReason, ReactNode> = {
    official: t("title_official"),
    core: t("title_core"),
    unverified: t("title_not_verified"),
    lookalike: t("title_lookalike"),
  };

  const reasonText: Record<TrustReason, ReactNode> = {
    official: t("reason_official", { name: token.name ?? "", network }),
    core: t("reason_core"),
    unverified: t("reason_not_verified"),
    lookalike: t(`reason_lookalike_${match}`, { symbol: officialSymbol }),
  };

  const checks: { kind: CheckKind; text: ReactNode }[] = [];
  if (trust.reason === "official") {
    checks.push({ kind: "pass", text: t("check_in_default") });
    if (trust.alsoIn.length) {
      checks.push({ kind: "info", text: t("check_also_in_lists", { count: trust.alsoIn.length }) });
    }
  } else {
    checks.push({ kind: "fail", text: t("check_not_in_default") });
    checks.push(
      trust.onCoreList
        ? { kind: "pass", text: t("check_core") }
        : { kind: "fail", text: t("check_not_core") },
    );
    checks.push(
      trust.reason === "lookalike"
        ? { kind: "fail", text: t(`check_same_${match}`, { symbol: officialSymbol }) }
        : { kind: "pass", text: t("check_name_ok") },
    );
    if (trust.reason === "core" && inFree) {
      checks.push({ kind: "info", text: t("check_also_in_free") });
    }
    if (trust.reason === "unverified" && onlyInFree) {
      checks.push({ kind: "info", text: t("check_only_in_free") });
    }
  }

  return (
    <div className="w-[380px] max-w-[calc(100vw-16px)] bg-primary-bg border border-secondary-border rounded-3 p-4 flex flex-col gap-3 shadow-popover shadow-black/70 text-left">
      <div className="flex items-center justify-between gap-2">
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-5 pl-2 pr-1.5 py-1 text-12 font-medium",
            levelColors[trust.level],
          )}
        >
          <BadgeContent trust={trust} />
        </span>
        <span className="text-12 text-tertiary-text">
          {t("trust_level", { level: levelText[trust.level] })}
        </span>
      </div>
      <p className="text-16 font-medium text-primary-text">{title[trust.reason]}</p>
      <p className="text-14 text-secondary-text">{reasonText[trust.reason]}</p>
      <div className="grid grid-cols-3 gap-1">
        {levels.map((level) => {
          const active = level === trust.level;
          return (
            <div key={level} className="flex flex-col gap-1.5">
              <div
                className={clsx(
                  "h-1 rounded-[2px]",
                  active
                    ? level === "high"
                      ? "bg-green"
                      : level === "medium"
                        ? "bg-orange"
                        : "bg-red-light"
                    : "bg-quaternary-bg",
                )}
              />
              <span
                className={clsx(
                  "text-12 font-medium",
                  active
                    ? level === "high"
                      ? "text-green"
                      : level === "medium"
                        ? "text-orange"
                        : "text-red-light"
                    : "text-tertiary-text",
                )}
              >
                {levelText[level]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        {checks.map((check, index) => (
          <CheckLine key={index} kind={check.kind}>
            {check.text}
          </CheckLine>
        ))}
      </div>
      {trust.reason === "lookalike" && official && (
        <div className="bg-red-bg rounded-2 p-3 flex flex-col gap-1.5">
          <span className="text-12 font-medium text-red-light">
            {t("official_token_erc20", { symbol: officialSymbol })}
          </span>
          <TrustAddress address={official.address0} chainId={chainId} />
        </div>
      )}
      <div className="h-px bg-secondary-border" />
      <ContractLine standard={Standard.ERC20} address={token.address0} chainId={chainId} />
      <ContractLine standard={Standard.ERC223} address={token.address1} chainId={chainId} />
      <p className="text-12 text-tertiary-text">{t("footnote")}</p>
    </div>
  );
}
