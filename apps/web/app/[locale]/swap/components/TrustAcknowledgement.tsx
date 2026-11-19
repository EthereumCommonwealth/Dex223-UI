import Alert from "@repo/ui/alert";
import Checkbox from "@repo/ui/checkbox";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useEffect, useMemo, useState } from "react";

import Svg from "@/components/atoms/Svg";
import TrustBadge, { TrustAddress } from "@/components/badges/TrustBadge";
import { getSwapTrustGate, SwapSide } from "@/functions/swapTrustGate";
import { TokenTrust } from "@/functions/tokenTrust";
import truncateMiddle from "@/functions/truncateMiddle";
import { useTokens, useTokenTrust } from "@/hooks/useTokenLists";
import { Currency } from "@/sdk_bi/entities/currency";
import { Token } from "@/sdk_bi/entities/token";
import { Standard } from "@/sdk_bi/standard";

// Review swap and Review margin swap: trust badge and contract address on both token cards, and
// the acknowledgement gate for Not verified and Lookalike tokens (#142, Figma page 31). Cards,
// badge and gate read the same useTokenTrust() result as the swap form.

/** Trust/Badge on a review card's label row. Native coins have none. */
export function ReviewCardTrustBadge({
  token,
  trust,
}: {
  token: Currency | undefined;
  trust: TokenTrust<Token> | undefined;
}) {
  if (!token || token.isNative) return null;
  return <TrustBadge token={token} trust={trust} />;
}

/** The contract address of the selected standard (ERC-223 shows address1), or "Native coin, no contract". */
export function ReviewCardAddress({
  token,
  trust,
  standard,
}: {
  token: Currency | undefined;
  trust: TokenTrust<Token> | undefined;
  standard: Standard;
}) {
  const t = useTranslations("Swap");
  if (!token) return null;
  if (token.isNative) {
    return <span className="text-tertiary-text text-14">{t("native_no_contract")}</span>;
  }
  return (
    <TrustAddress
      address={standard === Standard.ERC223 ? token.address1 : token.address0}
      chainId={token.chainId}
      danger={trust?.reason === "lookalike"}
    />
  );
}

/**
 * Trust level of both tokens and the acknowledgement state. The check resets when the tokens,
 * standards, amount or quote change (`resetKey`). Conversions (same token both sides) never gate.
 */
export function useSwapTrustGate({
  tokenA,
  tokenB,
  resetKey,
  enabled = true,
}: {
  tokenA: Currency | undefined;
  tokenB: Currency | undefined;
  resetKey: string;
  enabled?: boolean;
}) {
  const trustA = useTokenTrust(tokenA);
  const trustB = useTokenTrust(tokenB);

  const gate = useMemo(
    () =>
      getSwapTrustGate<Token>(
        enabled
          ? [
              tokenA?.isToken
                ? { side: "pay" as const, symbol: tokenA.symbol ?? "", trust: trustA }
                : undefined,
              tokenB?.isToken
                ? { side: "receive" as const, symbol: tokenB.symbol ?? "", trust: trustB }
                : undefined,
            ]
          : [],
      ),
    [enabled, tokenA, tokenB, trustA, trustB],
  );

  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    setAcknowledged(false);
  }, [resetKey]);

  return { ...gate, trustA, trustB, acknowledged, setAcknowledged };
}

export type SwapTrustGateState = ReturnType<typeof useSwapTrustGate>;

/** The default-list token as a Token instance (list entries come back from IndexedDB as plain objects). */
function useOfficialTokens(gate: SwapTrustGateState) {
  const tokens = useTokens();
  return useMemo(() => {
    const byAddress = new Map(
      tokens.filter((c): c is Token => c.isToken).map((c) => [c.address0.toLowerCase(), c]),
    );
    const result = new Map<SwapSide, Token>();
    gate.flagged.forEach(({ side, trust }) => {
      const official = trust?.official;
      if (!official) return;
      result.set(
        side,
        byAddress.get(official.address0.toLowerCase()) ??
          new Token(
            official.chainId,
            official.address0,
            official.address1,
            official.decimals,
            official.symbol,
            official.name,
            official.logoURI,
          ),
      );
    });
    return result;
  }, [gate.flagged, tokens]);
}

/**
 * One alert per flagged token in card order, "Use official X instead" under a lookalike, and one
 * checkbox for all of them. Sits between the details and the price-impact gate.
 */
export function TrustAcknowledgement({
  id,
  gate,
  onUseOfficial,
  className,
}: {
  id: string;
  gate: SwapTrustGateState;
  onUseOfficial: (side: SwapSide, official: Token) => void;
  className?: string;
}) {
  const t = useTranslations("Swap");
  const locale = useLocale();
  const officialTokens = useOfficialTokens(gate);

  if (!gate.required) return null;

  const symbols = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
    gate.ackSymbols,
  );

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        {gate.flagged.map(({ side, symbol, trust }) => {
          const official = officialTokens.get(side);
          if (trust?.reason === "lookalike" && official) {
            return (
              <Fragment key={side}>
                <Alert
                  type="error"
                  text={t("trust_lookalike_warning", {
                    symbol,
                    officialName: official.name ?? "",
                    officialSymbol: official.symbol ?? "",
                    match: trust.match ?? "name_and_symbol",
                    address: truncateMiddle(official.address0, {
                      charsFromStart: 6,
                      charsFromEnd: 6,
                    }),
                  })}
                />
                <button
                  type="button"
                  onClick={() => onUseOfficial(side, official)}
                  className="flex items-center gap-1.5 self-start text-14 font-medium text-green hocus:text-green-hover duration-200"
                >
                  <Svg size={20} iconName="swap" />
                  {t("use_official_token", { symbol: official.symbol ?? "" })}
                </button>
              </Fragment>
            );
          }
          return (
            <Alert key={side} type="warning" text={t("trust_not_verified_warning", { symbol })} />
          );
        })}
        <Checkbox
          id={id}
          checked={gate.acknowledged}
          handleChange={() => gate.setAcknowledged(!gate.acknowledged)}
          label={
            gate.anyLookalike
              ? t("trust_ack_lookalike", { symbols, count: gate.ackSymbols.length })
              : t("trust_ack_not_verified", { symbols, count: gate.ackSymbols.length })
          }
          labelClassName="text-primary-text"
        />
      </div>
    </div>
  );
}
