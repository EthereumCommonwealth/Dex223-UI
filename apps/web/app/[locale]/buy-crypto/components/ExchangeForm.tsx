import Alert from "@repo/ui/alert";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import ExchangeTokenInput from "@/app/[locale]/buy-crypto/components/ExchangeTokenInput";
import PickTokenDialog from "@/app/[locale]/buy-crypto/components/PickTokenDialog";
import { OutputAmountError } from "@/app/[locale]/buy-crypto/hooks/useOutputAmount";
import { ExchangeToken } from "@/app/[locale]/buy-crypto/types";
import Svg from "@/components/atoms/Svg";
import TextField from "@/components/atoms/TextField";
import Button from "@/components/buttons/Button";
import SwapButton from "@/components/buttons/SwapButton";

interface Props {
  recipient: string;
  tokensFrom: ExchangeToken[];
  tokensTo: ExchangeToken[];
  tokenA: ExchangeToken | undefined;
  tokenB: ExchangeToken | undefined;
  inputAmount: string;
  setInputAmount: any;
  isLoadingMinAmount: boolean;
  isFixed: boolean;
  setIsFixed: any;
  setTokenA: any;
  setTokenB: any;
  handleCreateExchange: any;
  minAmount: string | null;
  maxAmount: string | null;
  outputAmount: string | null;
  isLoadingOutputAmount: boolean;
  setRecipient: any;
  tokensFromLoading: boolean;
  tokensToLoading: boolean;
  isFiat?: boolean;
  outputAmountError: OutputAmountError | null;
}

export default function ExchangeForm({
  tokensFrom,
  tokensTo,
  tokensFromLoading,
  tokensToLoading,
  recipient,
  handleCreateExchange,
  inputAmount,
  isFixed,
  isLoadingMinAmount,
  setInputAmount,
  setIsFixed,
  setTokenA,
  setTokenB,
  tokenA,
  tokenB,
  minAmount,
  maxAmount,
  outputAmount,
  isLoadingOutputAmount,
  setRecipient,
  isFiat,
  outputAmountError,
}: Props) {
  const [pickTokenContext, setPickTokenContext] = useState<"tokenA" | "tokenB">("tokenA");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleChange = useCallback(
    (token: any) => {
      if (pickTokenContext === "tokenA") {
        setTokenA(token);
      } else {
        setTokenB(token);
      }
    },
    [pickTokenContext, setTokenA, setTokenB],
  );

  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    const regexString = tokenB?.validation_address;

    if (regexString) {
      const regex = new RegExp(regexString);

      if (!!recipient && !regex.test(recipient)) {
        setAddressError(`Invalid wallet address for ${tokenB?.network.toUpperCase()} network`);
      } else {
        setAddressError("");
      }
    }
  }, [recipient, tokenB?.network, tokenB?.validation_address]);

  return (
    <>
      <div className="mt-3 bg-primary-bg px-1 pb-6 md:pb-10 rounded-5">
        <h1 className="py-3.5 text-16 md:text-20 font-bold px-3 md:px-0">Crypto exchange</h1>
        <ExchangeTokenInput
          handleClick={() => {
            setIsOpen(true);
            setPickTokenContext("tokenA");
          }}
          token={tokenA}
          value={inputAmount}
          onInputChange={(value) => {
            setInputAmount(value);
          }}
          label="You send"
          minAmount={minAmount || undefined}
          maxAmount={maxAmount || undefined}
          minAmountLoading={isLoadingMinAmount}
        />
        <div className="relative h-8 z-10">
          <div className="absolute left-3 md:left-5 flex gap-1 items-center h-full top-0">
            <button
              onClick={() => setIsFixed(!isFixed)}
              className={clsx("group flex items-center gap-1", isFiat && "pointer-events-none")}
            >
              <span
                className={clsx(
                  "rounded-full w-6 h-6 flex items-center justify-center relative duration-200 before:duration-200 before:absolute before:h-[calc(100%_+_8px)] before:left-1/2 before:w-px  before:-translate-x-1/2 z-30 before:z-20",
                  isFixed
                    ? "group-hover:before:bg-green-hover group-hover:bg-green-hover before:bg-green bg-green"
                    : "group-hover:before:bg-green-bg group-hover:bg-green-bg before:bg-secondary-bg bg-secondary-bg ",
                )}
              >
                {isFixed ? (
                  <Svg className="z-40 text-secondary-bg" size={16} iconName="block" />
                ) : (
                  <Svg
                    className="duration-200 z-40 text-tertiary-text group-hover:text-primary-text"
                    size={16}
                    iconName="swap"
                  />
                )}
              </span>
              <span
                className={clsx(
                  "text-10 md:text-12 whitespace-nowrap",
                  isFixed ? "text-primary-text" : "text-tertiary-text",
                )}
              >
                {isFixed ? "Fixed rate" : "Floating rate"}
                {isFiat && " only"}
              </span>
            </button>

            <Tooltip iconSize={16} text="Tooltip floating rate" />
          </div>

          <SwapButton
            onClick={() => {
              setTokenB(tokenA);
              setTokenA(tokenB);
              setInputAmount(outputAmount || "");
            }}
          />
        </div>
        <ExchangeTokenInput
          handleClick={() => {
            setIsOpen(true);
            setPickTokenContext("tokenB");
          }}
          isLoadingAmount={isLoadingOutputAmount}
          readOnly
          token={tokenB}
          value={outputAmount || ""}
          onInputChange={() => {}}
          label="You get"
        />
        <div className="my-3 px-3 md:px-0">
          <TextField
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
            }}
            error={addressError}
            label="The recepient's wallet address"
            placeholder="0x..."
          />
        </div>
        {outputAmountError === OutputAmountError.NOT_FOUND && (
          <div className="mb-5 px-3 md:px-0">
            <Alert text="Pair is not supported" type="error" />
          </div>
        )}

        <div className="px-3 md:px-0">
          <Button
            disabled={
              !recipient ||
              isLoadingMinAmount ||
              isLoadingOutputAmount ||
              !outputAmount ||
              !minAmount ||
              !!addressError
            }
            onClick={() => handleCreateExchange()}
            fullWidth
          >
            Create an exchange
          </Button>
        </div>
      </div>
      <PickTokenDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        handlePick={handleChange}
        tokens={pickTokenContext === "tokenA" ? tokensFrom : tokensTo}
        tokensLoading={pickTokenContext === "tokenA" ? tokensFromLoading : tokensToLoading}
      />
    </>
  );
}
