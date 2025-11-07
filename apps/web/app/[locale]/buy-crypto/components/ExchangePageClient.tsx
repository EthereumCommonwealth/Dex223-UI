"use client";

import Alert from "@repo/ui/alert";
import ExternalTextLink from "@repo/ui/external-text-link";
import clsx from "clsx";
import Image from "next/image";
import { parseAsBoolean, useQueryState } from "nuqs";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import CountdownTimer from "@/app/[locale]/buy-crypto/components/Countdown";
import CryptoExchangeForm from "@/app/[locale]/buy-crypto/components/CryptoExchangeForm";
import FiatExchangeForm from "@/app/[locale]/buy-crypto/components/FiatExchangeForm";
import {
  ExchangeData,
  ExchangeStatus,
  ExchangeToken,
  TrackedExchangeStatus,
} from "@/app/[locale]/buy-crypto/types";
import DetailsRow from "@/app/[locale]/swap/components/SwapDetailsRow";
import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import Button from "@/components/buttons/Button";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import Tab from "@/components/tabs/Tab";
import Tabs from "@/components/tabs/Tabs";
import { IconName } from "@/config/types/IconName";
import { clsxMerge } from "@/functions/clsxMerge";
import { formatFloat } from "@/functions/formatFloat";
import { IIFE } from "@/functions/iife";
import truncateMiddle from "@/functions/truncateMiddle";
import { Link } from "@/i18n/routing";

const statusIconsMap: Record<TrackedExchangeStatus, IconName> = {
  [ExchangeStatus.WAITING]: "list",
  [ExchangeStatus.CONFIRMING]: "check",
  [ExchangeStatus.EXCHANGING]: "swap",
  [ExchangeStatus.SENDING]: "lending",
};

const statusTextMap: Record<TrackedExchangeStatus, string> = {
  [ExchangeStatus.WAITING]: "Pending deposit",
  [ExchangeStatus.CONFIRMING]: "Confirming",
  [ExchangeStatus.EXCHANGING]: "Exchanging",
  [ExchangeStatus.SENDING]: "Sending",
};

const headingTextMap: Record<ExchangeStatus, { heading: string; subheading?: string }> = {
  [ExchangeStatus.WAITING]: {
    heading: "Awaiting your deposit",
  },
  [ExchangeStatus.CONFIRMING]: {
    heading: "Confirming the transaction",
    subheading: "Number of blockchain confirmations:",
  },
  [ExchangeStatus.EXPIRED]: {
    heading: "Deposit time expired",
  },
  [ExchangeStatus.EXCHANGING]: {
    heading: "Exchanging",
    subheading: "Your coins are safe and being exchanged",
  },
  [ExchangeStatus.SENDING]: { heading: "Sending", subheading: "Coins are on the way" },
  [ExchangeStatus.FINISHED]: { heading: "Crypto exchanged successfully" },
  [ExchangeStatus.FAILED]: { heading: "Failed to exchange crypto" },
  [ExchangeStatus.VERIFYING]: { heading: "Verifying exchange" },
  [ExchangeStatus.REFUNDED]: { heading: "Assets was refunded" },
};

const trackedStatuses: TrackedExchangeStatus[] = [
  ExchangeStatus.WAITING,
  ExchangeStatus.CONFIRMING,
  ExchangeStatus.EXCHANGING,
  ExchangeStatus.SENDING,
];
function ExchangeStatusInfo({
  status,
  isActive,
  isPassed,
}: {
  status: TrackedExchangeStatus;
  isActive?: boolean;
  isPassed?: boolean;
}) {
  return (
    <div
      className={clsxMerge(
        "relative",
        status !== "sending" &&
          "before:absolute before:h-0.5 before:w-3 md:before:w-5 before:bg-green-bg before:right-0 before:top-1/2 before:translate-x-full before:-translate-y-1/2",
        isPassed && "before:bg-green",
      )}
    >
      <div
        className={clsxMerge(
          "flex relative items-center justify-center rounded-full mx-auto w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2 text-secondary-bg",
          isActive ? "bg-green text-secondary-bg" : "text-tertiary-text bg-tertiary-bg",
          isPassed && "text-green bg-green-bg",
        )}
      >
        <Svg iconName={statusIconsMap[status]} size={16} className="md:w-5 md:h-5" />
      </div>
      <p
        className={clsxMerge(
          "text-center text-10 md:text-14 font-medium",
          (!isActive || isPassed) && "text-tertiary-text",
        )}
      >
        {statusTextMap[status]}
      </p>
    </div>
  );
}

export default function ExchangePageClient({
  tokens,
  initialExchange,
}: {
  tokens: ExchangeToken[];
  initialExchange?: ExchangeData;
}) {
  const tokenMap = useMemo(() => new Map(tokens.map((token) => [token.symbol, token])), [tokens]);

  const [exchange, setExchange] = useState<ExchangeData | undefined>(initialExchange);

  console.log(initialExchange);

  const [addressQRUrl, setAddressQRUrl] = useState("");

  useEffect(() => {
    if (exchange?.address_from) {
      IIFE(async () => {
        const address = await QRCode.toDataURL(exchange.address_from);
        setAddressQRUrl(address);
      });
    }
  }, [exchange?.address_from]);

  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (pollingActive && exchange) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/simpleswap/get-exchange?exchangeId=${exchange.id}`);
          const data = await res.json();

          if (data) {
            setExchange(data);
          }

          if (data?.status === "finished") {
            clearInterval(intervalId);
            setPollingActive(false); // Stop polling
          }

          console.log(data);
        } catch (error) {
          console.error("Error fetching exchange data:", error);
        }
      }, 5000);
    }

    return () => clearInterval(intervalId); // Clean up the interval on unmount
  }, [pollingActive, exchange]);

  // Trigger polling when exchange is created or updated
  useEffect(() => {
    if (exchange && exchange.status !== "finished") {
      setPollingActive(true);
    }
  }, [exchange]);

  const inputAmount = exchange?.expected_amount;
  const outputAmount = exchange?.amount_to;
  const recipient = exchange?.address_to;
  const tx_from = exchange?.tx_from;
  const tx_to = exchange?.tx_to;
  const tokenA = exchange?.currencies[exchange.currency_from];
  const tokenB = exchange?.currencies[exchange.currency_to];

  const [fiatExchange, setFiatExchange] = useQueryState("fiatExchange", parseAsBoolean);

  console.log(fiatExchange);

  console.log(exchange);

  return (
    <Container className="px-0 md:px-4">
      <div className="mx-auto w-full max-w-[520px]">
        {exchange ? (
          <>
            <div className="bg-primary-bg py-1 pl-3 md:pl-5 pr-2 rounded-3 flex justify-between items-center my-5">
              <div className="flex items-center gap-1 text-12 md:text-14 overflow-hidden">
                <span className="text-secondary-text whitespace-nowrap">Exchange ID:</span>
                <span className="truncate">{exchange.id}</span>
                <IconButton variant={IconButtonVariant.COPY} text={exchange.id} />
              </div>
              <a
                className="flex items-center justify-center w-10 h-10 text-tertiary-text flex-shrink-0"
                href="#"
              >
                <Svg iconName="help-outline" />
              </a>
            </div>

            {exchange.redirect_url ? (
              <div className="px-4 md:px-10 pb-6 md:pb-10 pt-3.5 rounded-5 bg-primary-bg">
                <div>
                  <Link href={"/"} shallow={true} onClick={() => setExchange(undefined)}>
                    <IconButton iconName="back" />
                  </Link>
                </div>
                <div>
                  <span className="flex justify-center mb-4">
                    <Image src="/images/guardian.svg" alt={""} width={80} height={80} />
                  </span>

                  <h2 className="font-bold text-16 md:text-20 text-center">
                    <div className={clsx("flex items-center justify-center")}>
                      Continue on our partner&apos;s website
                    </div>
                  </h2>

                  {exchange.valid_until && exchange.status === "waiting" && (
                    <CountdownTimer validUntil={exchange.valid_until} />
                  )}
                  {exchange.status === "finished" && (
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <Image
                          width={24}
                          height={24}
                          src={tokenA?.image || "/images/tokens/placeholder.svg"}
                          alt={""}
                        />
                        <span className="font-medium text-14 md:text-16">
                          {inputAmount} {tokenA?.symbol}{" "}
                        </span>
                      </div>
                      <Svg className="text-tertiary-text" iconName="next" />
                      <div className="flex items-center gap-2">
                        <Image
                          width={24}
                          height={24}
                          src={tokenA?.image || "/images/tokens/placeholder.svg"}
                          alt={""}
                        />
                        <span className="font-medium text-14 md:text-16">
                          {inputAmount} {tokenA?.symbol}{" "}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-secondary-text mt-1 text-center mb-4 text-12 md:text-14">
                    To complete your transaction, you&apos;ll be redirected to a secure external
                    platform.
                  </p>

                  <a href={exchange.redirect_url} target="_blank">
                    <Button endIcon="forward" fullWidth>
                      Proceed to payment
                    </Button>
                  </a>
                </div>
                <div className="bg-tertiary-bg rounded-3 px-5 pb-4 mt-5">
                  <h3 className="py-3.5 text-14 text-tertiary-text">Operation details</h3>
                  <DetailsRow
                    title="You get"
                    value={
                      <div className="flex items-center gap-2">
                        <Image
                          width={20}
                          height={20}
                          src={tokenB?.image || "/images/tokens/placeholder.svg"}
                          alt=""
                        />
                        <span>
                          {outputAmount} {tokenB?.symbol?.toUpperCase()}
                        </span>
                      </div>
                    }
                    tooltipText={""}
                  />
                  <DetailsRow
                    title="Recipient address"
                    value={
                      <div className="flex items-center gap-1">
                        <ExternalTextLink
                          text={truncateMiddle(recipient || "", {
                            charsFromEnd: 3,
                            charsFromStart: 4,
                          })}
                          href={"#"}
                        />
                        <IconButton variant={IconButtonVariant.COPY} text={recipient || ""} />
                      </div>
                    }
                    tooltipText={""}
                  />
                </div>
              </div>
            ) : (
              <div className="px-4 md:px-10 pb-6 md:pb-10 pt-6 md:pt-8 rounded-5 bg-primary-bg flex flex-col gap-5">
                <div>
                  {exchange.status === "finished" && (
                    <span className="flex justify-center">
                      <Image src="/images/success-exchange.svg" alt={""} width={80} height={80} />
                    </span>
                  )}
                  {exchange.status === "failed" && (
                    <span className="flex justify-center">
                      <Image src="/images/success-exchange.svg" alt={""} width={80} height={80} />
                    </span>
                  )}
                  <h2 className="grid grid-cols-[40px_1fr_40px] md:grid-cols-[48px_1fr_48px] font-bold text-16 md:text-20 text-center">
                    <Link href={"/"} onClick={() => setExchange(undefined)}>
                      <IconButton iconName="back" />
                    </Link>

                    <div
                      className={clsx(
                        "flex items-center justify-center px-2",
                        exchange.status === ExchangeStatus.FAILED && "text-red-light",
                      )}
                    >
                      {headingTextMap[exchange.status].heading}
                    </div>
                  </h2>

                  {exchange.valid_until && exchange.status === ExchangeStatus.WAITING && (
                    <CountdownTimer validUntil={exchange.valid_until} />
                  )}
                  {exchange.status === "finished" && inputAmount && outputAmount && (
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <Image
                          width={24}
                          height={24}
                          src={tokenA?.image || "/images/tokens/placeholder.svg"}
                          alt={""}
                        />
                        <span className="font-medium text-14 md:text-16">
                          {formatFloat(inputAmount)} {tokenA?.symbol}{" "}
                        </span>
                      </div>
                      <Svg className="text-tertiary-text" iconName="next" />
                      <div className="flex items-center gap-2">
                        <Image
                          width={24}
                          height={24}
                          src={tokenB?.image || "/images/tokens/placeholder.svg"}
                          alt={""}
                        />
                        <span className="font-medium text-14 md:text-16">
                          {formatFloat(outputAmount)} {tokenB?.symbol?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-secondary-text mt-1 text-center text-12 md:text-14">
                    {headingTextMap[exchange.status].subheading}
                    {exchange.status === "confirming" && " 1"}
                  </p>
                </div>
                {exchange.status === "waiting" && (
                  <div className="flex flex-wrap items-center gap-2 text-14 md:text-16">
                    <span className="font-bold text-secondary-text">Send deposit:</span>
                    <Image
                      width={32}
                      height={32}
                      src={tokenA?.image || "/images/tokens/placeholder.svg"}
                      alt={""}
                    />
                    <span className="font-medium">
                      {inputAmount} {tokenA?.symbol}{" "}
                      <span className="text-secondary-text text-12 md:text-14">
                        (Network: {tokenA?.network})
                      </span>
                    </span>
                  </div>
                )}

                {addressQRUrl && exchange.status === "waiting" && (
                  <div className="flex flex-col md:flex-row pl-4 md:pl-5 pb-4 md:pb-5 pt-3 pr-2 bg-tertiary-bg rounded-3 gap-3 md:gap-5">
                    <div className="overflow-hidden rounded-2 flex-shrink-0 mx-auto md:mx-0">
                      <Image src={addressQRUrl} alt={""} width={86} height={86} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-secondary-text font-bold text-12 md:text-14 whitespace-nowrap">
                          Deposit address:
                        </span>
                        <div className="flex items-center flex-shrink-0">
                          <a
                            target="_blank"
                            href="#"
                            className="flex items-center justify-center h-10 w-10 group"
                          >
                            <IconButton iconName="forward" />
                          </a>
                          <IconButton
                            variant={IconButtonVariant.COPY}
                            text={exchange.address_from}
                          />
                        </div>
                      </div>
                      <span className="text-12 md:text-14 font-medium break-all">
                        {exchange.address_from}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 md:gap-5">
                  {trackedStatuses.map((status) => (
                    <ExchangeStatusInfo
                      isPassed={
                        exchange.status === "finished" ||
                        trackedStatuses.findIndex((s) => s === status) <
                          trackedStatuses.findIndex((s) => s === exchange.status)
                      }
                      isActive={status === exchange.status}
                      key={status}
                      status={status}
                    />
                  ))}
                </div>

                {exchange.status === "waiting" && (
                  <Alert
                    text="If you sent the coins and the status did not change immediately, do not worry. Our system needs a few minutes to detect the transaction."
                    type="info"
                  />
                )}

                <div className="bg-tertiary-bg rounded-3 px-5 pb-4">
                  <h3 className="py-3.5 text-14 text-tertiary-text">Operation details</h3>
                  <DetailsRow
                    title="You get"
                    value={
                      <div className="flex items-center gap-2">
                        <Image
                          width={20}
                          height={20}
                          src={tokenB?.image || "/images/tokens/placeholder.svg"}
                          alt=""
                        />
                        <span>
                          {outputAmount} {tokenB?.symbol?.toUpperCase()}
                        </span>
                      </div>
                    }
                    tooltipText={""}
                  />
                  <DetailsRow
                    title="Recipient address"
                    value={
                      <div className="flex items-center gap-1">
                        <ExternalTextLink
                          text={truncateMiddle(recipient || "", {
                            charsFromEnd: 3,
                            charsFromStart: 4,
                          })}
                          href={"#"}
                        />
                        <IconButton variant={IconButtonVariant.COPY} text={recipient || ""} />
                      </div>
                    }
                    tooltipText={""}
                  />

                  {exchange.status !== "waiting" && (
                    <>
                      <div className="h-px  bg-secondary-border my-4" />
                      <DetailsRow
                        title="You sent"
                        value={
                          <div className="flex items-center gap-2">
                            <Image
                              width={20}
                              height={20}
                              src={tokenA?.image || "/images/tokens/placeholder.svg"}
                              alt=""
                            />
                            <span>
                              {inputAmount} {tokenA?.symbol}
                            </span>
                          </div>
                        }
                        tooltipText={""}
                      />
                      <DetailsRow
                        title="Deposit address"
                        value={
                          <div className="flex items-center gap-1">
                            <ExternalTextLink
                              text={truncateMiddle(exchange?.address_from || "", {
                                charsFromEnd: 3,
                                charsFromStart: 4,
                              })}
                              href={"#"}
                            />
                            <IconButton
                              variant={IconButtonVariant.COPY}
                              text={exchange?.address_from}
                            />
                          </div>
                        }
                        tooltipText={""}
                      />
                      {exchange.tx_to && tokenB && (
                        <DetailsRow
                          title="Hash in"
                          value={
                            <div className="flex items-center gap-1">
                              <ExternalTextLink
                                text={truncateMiddle(tx_to || "", {
                                  charsFromEnd: 3,
                                  charsFromStart: 4,
                                })}
                                href={
                                  exchange.currencies[tokenB.symbol].tx_explorer?.replace(
                                    /{}/,
                                    exchange.tx_to,
                                  ) || "#"
                                }
                              />
                              <IconButton variant={IconButtonVariant.COPY} text={tx_to || ""} />
                            </div>
                          }
                          tooltipText={""}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <Tabs
            activeTab={fiatExchange ? 1 : 0}
            setActiveTab={(value: number) => {
              if (value === 0) {
                setFiatExchange(null);
                return;
              }
              setFiatExchange(true);
            }}
            fullWidth
          >
            <Tab title="Swap Crypto">
              <CryptoExchangeForm tokens={tokens} tokenMap={tokenMap} setExchange={setExchange} />
            </Tab>
            <Tab title="Buy Crypto">
              <FiatExchangeForm tokens={tokens} tokenMap={tokenMap} setExchange={setExchange} />
            </Tab>
          </Tabs>
        )}
      </div>
    </Container>
  );
}
