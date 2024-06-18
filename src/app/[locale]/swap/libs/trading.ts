import JSBI from "jsbi";
import { useMemo } from "react";
import { Address, parseUnits } from "viem";
import { useAccount, useSimulateContract } from "wagmi";

import { useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import { useSwapTokensStore } from "@/app/[locale]/swap/stores/useSwapTokensStore";
import { QUOTER_ABI } from "@/config/abis/quoter";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { PoolState, usePool } from "@/hooks/usePools";
import { QUOTER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { FeeAmount, TradeType } from "@/sdk_hybrid/constants";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";
import { Route } from "@/sdk_hybrid/entities/route";
import { Trade } from "@/sdk_hybrid/entities/trade";

export type TokenTrade = Trade<Currency, Currency, TradeType>;

export function useTrade(): { trade: TokenTrade | null; isLoading: boolean } {
  const { tokenA, tokenB, tokenAAddress, tokenBAddress, setTokenA, setTokenB } =
    useSwapTokensStore();
  // const { typedValue, independentField, dependentField, setTypedValue } = useSwapAmountsStore();
  const { address } = useAccount();
  const chainId = useCurrentChainId();
  const { typedValue } = useSwapAmountsStore();
  const [poolState, pool] = usePool({
    currencyA: tokenA,
    currencyB: tokenB,
    tier: FeeAmount.MEDIUM,
  });

  const swapRoute = useMemo(() => {
    if (!pool || !tokenA || !tokenB) {
      return null;
    }

    const [_tokenA, _tokenB] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];

    if (pool.token0.address0 !== _tokenA.address0 || pool.token1.address0 !== _tokenB.address0) {
      return null;
    }

    return new Route([pool], tokenA, tokenB);
  }, [pool, tokenA, tokenB]);

  const amountOutData = useSimulateContract({
    chainId,
    address: QUOTER_ADDRESS[chainId as DexChainId],
    abi: QUOTER_ABI,
    account: address || QUOTER_ADDRESS[chainId as DexChainId],
    functionName: "quoteExactInputSingle",
    args: [
      tokenA?.address0 as Address,
      tokenB?.address0 as Address,
      FeeAmount.MEDIUM, //3000
      parseUnits(typedValue, tokenA?.decimals || 18),
      BigInt(0),
    ],
    query: {
      enabled:
        Boolean(tokenA) &&
        Boolean(tokenB) &&
        Boolean(tokenAAddress) &&
        Boolean(tokenBAddress) &&
        Boolean(typedValue) &&
        Boolean(+typedValue),
    },
  });

  const amountOut = useMemo(() => {
    if (amountOutData.data) {
      return amountOutData.data.result;
    }

    return;
  }, [amountOutData.data]);

  const trade = useMemo(() => {
    if (
      !swapRoute ||
      !tokenA ||
      !tokenB ||
      !amountOut ||
      !typedValue ||
      !Boolean(+typedValue) ||
      swapRoute.input.address0 !== tokenA.address0 ||
      swapRoute.output.address0 !== tokenB.address0
    ) {
      return null;
    }

    return Trade.createUncheckedTrade({
      route: swapRoute,
      inputAmount: CurrencyAmount.fromRawAmount(
        tokenA,
        parseUnits(typedValue, tokenA?.decimals).toString(),
      ),
      outputAmount: CurrencyAmount.fromRawAmount(tokenB, JSBI.BigInt(amountOut.toString())),
      tradeType: TradeType.EXACT_INPUT,
    });
  }, [amountOut, swapRoute, tokenA, tokenB, typedValue]);
  return {
    trade,
    isLoading: poolState === PoolState.LOADING,
  };
}
