import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
} from "@floating-ui/react";
import clsx from "clsx";
import Image from "next/image";
import React, { ReactNode, useMemo, useRef, useState } from "react";

import Svg from "@/components/atoms/Svg";

type BadgeTrustRate = "high" | "medium" | "low";

const iconsMap: Record<BadgeTrustRate, ReactNode> = {
  high: <Svg size={20} iconName="high-trust" />,
  medium: <Svg size={20} iconName="medium-trust" />,
  low: <Svg size={20} iconName="low-trust" />,
};

const textMap: Record<BadgeTrustRate, ReactNode> = {
  high: "High trust",
  medium: "Medium trust",
  low: "Low trust",
};

const internalTextMap: Record<BadgeTrustRate, ReactNode> = {
  high: "Trusted",
  medium: "Not enough data",
  low: "Scam",
};

export enum OtherListCheck {
  NOT_FOUND,
  FOUND_IN_ONE,
  FOUND_IN_MORE_THAN_A_HALF,
}

export enum TrustRateCheck {
  TRUE,
  FALSE,
}

export enum Check {
  DEFAULT_LIST,
  OTHER_LIST,
  SAME_NAME_IN_DEFAULT_LIST,
  SAME_NAME_IN_OTHER_LIST,
  ERC223_VERSION_EXIST,
}

export type Rate = {
  [Check.DEFAULT_LIST]: TrustRateCheck;
  [Check.OTHER_LIST]?: OtherListCheck;
  [Check.SAME_NAME_IN_DEFAULT_LIST]: TrustRateCheck;
  [Check.SAME_NAME_IN_OTHER_LIST]?: TrustRateCheck;
  [Check.ERC223_VERSION_EXIST]: TrustRateCheck;
};

type RateKey = keyof Rate;
type RateObj = { score: number; text: string };

type Entries<T> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T][];

const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

type RateValueMap<T extends RateKey> = T extends
  | Check.DEFAULT_LIST
  | Check.SAME_NAME_IN_DEFAULT_LIST
  | Check.SAME_NAME_IN_OTHER_LIST
  | Check.ERC223_VERSION_EXIST
  ? Record<TrustRateCheck, RateObj>
  : T extends Check.OTHER_LIST
    ? Record<OtherListCheck, RateObj>
    : never;

type RateMap = {
  [K in RateKey]: RateValueMap<K>;
};

const rateMap: RateMap = {
  [Check.DEFAULT_LIST]: {
    [TrustRateCheck.TRUE]: {
      score: 90,
      text: "Token is in the default list",
    },
    [TrustRateCheck.FALSE]: {
      score: -20,
      text: "Token is NOT on the default list",
    },
  },
  [Check.OTHER_LIST]: {
    [OtherListCheck.NOT_FOUND]: {
      score: -15,
      text: "Token is NOT found in any other token lists",
    },
    [OtherListCheck.FOUND_IN_ONE]: {
      score: 15,
      text: "Token is found in at least one other token list",
    },
    [OtherListCheck.FOUND_IN_MORE_THAN_A_HALF]: {
      score: 25,
      text: "Token is found in more than half your token lists",
    },
  },
  [Check.SAME_NAME_IN_DEFAULT_LIST]: {
    [TrustRateCheck.FALSE]: {
      score: 5,
      text: "There is no different token with the same name in the default list",
    },
    [TrustRateCheck.TRUE]: {
      score: -90,
      text: "There is a different token with the same name in default list",
    },
  },
  [Check.SAME_NAME_IN_OTHER_LIST]: {
    [TrustRateCheck.FALSE]: {
      score: 20,
      text: "There is no different token with the same name in other token lists",
    },
    [TrustRateCheck.TRUE]: {
      score: -10,
      text: "There is a different token with the same name in other token list ",
    },
  },
  [Check.ERC223_VERSION_EXIST]: {
    [TrustRateCheck.FALSE]: {
      score: 0,
      text: "There is no ERC-223 version for this token",
    },
    [TrustRateCheck.TRUE]: {
      score: 10,
      text: "There is a ERC-223 version of this token in the token converter",
    },
  },
};

interface Props {
  rate: Rate;
  logoURI?: string;
}

interface InternalProps {
  totalScore: number;
  rate: Rate;
  rateRange: BadgeTrustRate;
  logoURI?: string;
}

export function rateToScore(rate: Rate) {
  return getEntries(rate).reduce((acc, [key, value]) => {
    if (key === Check.OTHER_LIST) {
      const rateValueMap = rateMap[key as RateKey] as RateValueMap<typeof key>;
      return value ? acc + rateValueMap[value as OtherListCheck].score : 0;
    } else {
      const rateValueMap = rateMap[key as RateKey] as RateValueMap<typeof key>;
      return acc + rateValueMap[value as TrustRateCheck].score;
    }
  }, 0);
}

function InternalTrustBadge({ rateRange }: { rateRange: BadgeTrustRate }) {
  return (
    <div
      className={clsx(
        "rounded-5 py-1 flex items-center gap-1 pl-2 pr-2 text-12",
        rateRange === "high" && "text-green bg-green-bg",
        rateRange === "medium" && "text-orange bg-orange-bg",
        rateRange === "low" && "text-red-light bg-red-bg",
      )}
    >
      {iconsMap[rateRange]}
      {internalTextMap[rateRange]}
    </div>
  );
}

function TooltipContent({ rate, logoURI, rateRange, totalScore }: InternalProps) {
  console.log("Rate:", rate);
  const internalTokenScore = useMemo(() => {
    if (totalScore > 100) {
      return 100;
    }
    if (totalScore < -100) {
      return -100;
    }

    return totalScore;
  }, [totalScore]);

  return (
    <>
      <div className="grid grid-cols-[10fr_16fr_10fr] md:grid-cols-3">
        <div className="flex justify-start">
          <InternalTrustBadge rateRange="low" />
        </div>
        <div className="flex justify-center">
          <InternalTrustBadge rateRange="medium" />
        </div>
        <div className="flex justify-end">
          <InternalTrustBadge rateRange="high" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[2fr_1fr_2fr] h-[5px] relative">
        <div className="h-full bg-red-light" />
        <div className="h-full bg-orange" />
        <div className="h-full bg-green" />
        <div
          className={clsx(
            "absolute border-[2px]  top-1/2 -translate-y-1/2 rounded-full w-6 h-6 bg-primary-bg",
            rateRange === "low" && "border-red-light",
            rateRange === "medium" && "border-orange -translate-x-1/2 ",
            rateRange === "high" && "border-green",
          )}
          style={
            internalTokenScore < 99 ? { left: `${(internalTokenScore + 100) / 2}%` } : { right: 0 }
          }
        >
          <Image
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            src={logoURI || "/tokens/placeholder.svg"}
            alt=""
            width={20}
            height={20}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center text-secondary-text mt-4 mb-5 text-12 ">
        <span>-100</span>
        <span className="flex justify-center">0</span>
        <span className="flex justify-end">100</span>
      </div>
      <div className="p-5 rounded-3 bg-tertiary-bg flex flex-col gap-2 text-14">
        {getEntries(rate).map(([key, value]) => {
          if (key === Check.OTHER_LIST && Boolean(value)) {
            const rateValueMap = rateMap[key as RateKey] as RateValueMap<typeof key>;
            const { text, score } = rateValueMap[value as OtherListCheck];
            return (
              <div key={key} className="flex justify-between items-center gap-2">
                <p className="flex items-start gap-2">
                  <Svg
                    className={clsx(
                      score >= 0 ? "text-green" : "text-red-light",
                      "flex-shrink-0 mt-[0.2em]",
                    )}
                    iconName={score >= 0 ? "success" : "warning"}
                  />
                  <span>{text}</span>
                </p>
                {score >= 0 ? (
                  <span className="text-green">+{score}</span>
                ) : (
                  <span className="text-red-light">-{score}</span>
                )}
              </div>
            );
          } else {
            const rateValueMap = rateMap[key as RateKey] as RateValueMap<typeof key>;
            const { text, score } = rateValueMap[value as TrustRateCheck];

            return (
              <div key={key} className="flex justify-between items-center gap-2">
                <div className="flex items-start gap-2">
                  <Svg
                    size={20}
                    className={clsx(score >= 0 ? "text-green" : "text-red-light", "flex-shrink-0")}
                    iconName={score >= 0 ? "success" : "warning"}
                  />
                  <span>{text}</span>
                </div>
                {score >= 0 ? (
                  <span className="text-green">+{score}</span>
                ) : (
                  <span className="text-red-light">{score}</span>
                )}
              </div>
            );
          }
        })}
      </div>

      <div className="flex mt-4 justify-between items-center text-14">
        <span>Total score</span>
        <span
          className={clsx(internalTokenScore > 0 ? "text-green" : "text-red-light", "font-bold")}
        >
          {internalTokenScore}
        </span>
      </div>
    </>
  );
}

export default function TrustBadge({ rate, logoURI }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top",
    // Make sure the tooltip stays on the screen
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(17),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift(),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: {
      open: 200,
      close: 200,
    },
  });

  // Event listeners to change the open state
  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  // Role props for screen readers
  const role = useRole(context, { role: "tooltip" });

  // Merge all the interactions into prop getters
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const [rateRange, totalScore]: [BadgeTrustRate, number] = useMemo(() => {
    const totalScore = rateToScore(rate);

    if (totalScore < -20) {
      return ["low", totalScore];
    }
    if (totalScore >= -20 && totalScore <= 20) {
      return ["medium", totalScore];
    }
    return ["high", totalScore];
  }, [rate]);

  return (
    <>
      <div
        className={clsx(
          "rounded-5 py-1 flex items-center gap-1 pl-2 pr-1 cursor-pointer text-12",
          rateRange === "high" && "text-green bg-green-bg",
          rateRange === "medium" && "text-orange bg-orange-bg",
          rateRange === "low" && "text-red bg-red-bg",
        )}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {iconsMap[rateRange]}
        {textMap[rateRange]}
        <Svg size={20} iconName="info" />
      </div>
      {isOpen && (
        <FloatingPortal>
          {isMounted && (
            <div
              ref={refs.setFloating}
              style={{ ...floatingStyles, ...transitionStyles }}
              {...getFloatingProps()}
              className="p-5 bg-primary-bg border border-secondary-border rounded-3 relative z-[100]"
            >
              <TooltipContent
                rate={rate}
                rateRange={rateRange}
                totalScore={totalScore}
                logoURI={logoURI}
              />
              <FloatingArrow
                ref={arrowRef}
                context={context}
                strokeWidth={1}
                stroke={"#383C3A"}
                fill={"#1D1E1E"}
              />
            </div>
          )}
        </FloatingPortal>
      )}
    </>
  );
}

interface TrustMarkerProps extends Props {
  totalScore: number;
}
export function TrustMarker({ rate, logoURI, totalScore }: TrustMarkerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top",
    // Make sure the tooltip stays on the screen
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(17),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift(),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: {
      open: 200,
      close: 200,
    },
  });

  // Event listeners to change the open state
  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  // Role props for screen readers
  const role = useRole(context, { role: "tooltip" });

  // Merge all the interactions into prop getters
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const rateRange: BadgeTrustRate = useMemo(() => {
    const totalScore = rateToScore(rate);

    if (totalScore < -20) {
      return "low";
    }
    if (totalScore >= -20 && totalScore <= 20) {
      return "medium";
    }
    return "high";
  }, [rate]);

  if (rateRange === "high") {
    return null;
  }

  return (
    <div
      className="p-0.5 rounded-full bg-primary-bg relative z-10 group-hocus:bg-tertiary-bg duration-200"
      ref={refs.setReference}
      {...getReferenceProps()}
    >
      <div
        className={clsx(
          "rounded-full p-0.5 flex items-center gap-1 cursor-pointer text-12 ",
          rateRange === "medium" && "text-orange bg-orange-bg",
          rateRange === "low" && "text-red bg-red-bg",
        )}
      >
        <Svg size={20} iconName="warning-outline" />
      </div>
      {isOpen && (
        <FloatingPortal>
          {isMounted && (
            <div
              ref={refs.setFloating}
              style={{ ...floatingStyles, ...transitionStyles }}
              {...getFloatingProps()}
              className="p-5 bg-primary-bg border border-secondary-border rounded-3 relative z-[100]"
            >
              <TooltipContent
                rate={rate}
                rateRange={rateRange}
                totalScore={totalScore}
                logoURI={logoURI}
              />
              <FloatingArrow
                ref={arrowRef}
                context={context}
                strokeWidth={1}
                stroke={"#383C3A"}
                fill={"#1D1E1E"}
              />
            </div>
          )}
        </FloatingPortal>
      )}
    </div>
  );
}
