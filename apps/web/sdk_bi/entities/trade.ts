import { instanceOf } from "graphql/jsutils/instanceOf";
import { InvariantError } from "next/dist/shared/lib/invariant-error";
import invariant from "tiny-invariant";

import { CurrencyAmount } from "@/sdk_bi/entities/fractions/currencyAmount";
import { Fraction } from "@/sdk_bi/entities/fractions/fraction";
import { Percent } from "@/sdk_bi/entities/fractions/percent";
import { Price } from "@/sdk_bi/entities/fractions/price";
import { Pool } from "@/sdk_bi/entities/pool";
import { Token } from "@/sdk_bi/entities/token";
import { Standard } from "@/sdk_bi/standard";
import { sortedInsert } from "@/sdk_bi/utils/sortedInsert";
import { TickMath } from "@/sdk_bi/utils/tickMath";

import { FACTORY_ADDRESS } from "../addresses";
import { DexChainId } from "../chains";
import { TICK_SPACINGS, TradeType } from "../constants";
import { ONE, ZERO } from "../internalConstants";
import { computePoolAddress } from "../utils/computePoolAddress";
import { Currency } from "./currency";
import { Route } from "./route";

/**
 * Trades comparator, an extension of the input output comparator that also considers other dimensions of the trade in ranking them
 * @template TInput The input token, either Ether or an ERC-20
 * @template TOutput The output token, either Ether or an ERC-20
 * @template TTradeType The trade type, either exact input or exact output
 * @param a The first trade to compare
 * @param b The second trade to compare
 * @returns A sorted ordering for two neighboring elements in a trade array
 */
export function tradeComparator<
  TInput extends Currency,
  TOutput extends Currency,
  TTradeType extends TradeType,
>(a: Trade<TInput, TOutput, TTradeType>, b: Trade<TInput, TOutput, TTradeType>) {
  // must have same input and output token for comparison
  invariant(a.inputAmount.currency.equals(b.inputAmount.currency), "INPUT_CURRENCY");
  invariant(a.outputAmount.currency.equals(b.outputAmount.currency), "OUTPUT_CURRENCY");
  if (a.outputAmount.equalTo(b.outputAmount)) {
    if (a.inputAmount.equalTo(b.inputAmount)) {
      // consider the number of hops since each hop costs gas
      const aHops = a.swaps.reduce((total, cur) => total + cur.route.tokenPath.length, 0);
      const bHops = b.swaps.reduce((total, cur) => total + cur.route.tokenPath.length, 0);
      return aHops - bHops;
    }
    // trade A requires less input than trade B, so A should come first
    if (a.inputAmount.lessThan(b.inputAmount)) {
      return -1;
    } else {
      return 1;
    }
  } else {
    // tradeA has less output than trade B, so should come second
    if (a.outputAmount.lessThan(b.outputAmount)) {
      return 1;
    } else {
      return -1;
    }
  }
}

export interface BestTradeOptions {
  // how many results to return
  maxNumResults?: number;
  // the maximum number of hops a trade should contain
  maxHops?: number;
}

/**
 * Represents a trade executed against a set of routes where some percentage of the input is
 * split across each route.
 *
 * Each route has its own set of pools. Pools can not be re-used across routes.
 *
 * Does not account for slippage, i.e., changes in price environment that can occur between
 * the time the trade is submitted and when it is executed.
 * @template TInput The input token, either Ether or an ERC-20
 * @template TOutput The output token, either Ether or an ERC-20
 * @template TTradeType The trade type, either exact input or exact output
 */
export class Trade<
  TInput extends Currency,
  TOutput extends Currency,
  TTradeType extends TradeType,
> {
  /**
   * @deprecated Deprecated in favor of 'swaps' property. If the trade consists of multiple routes
   * this will return an error.
   *
   * When the trade consists of just a single route, this returns the route of the trade,
   * i.e. which pools the trade goes through.
   */
  public get route(): Route<TInput, TOutput> {
    invariant(this.swaps.length == 1, "MULTIPLE_ROUTES");
    return this.swaps[0].route;
  }

  /**
   * The swaps of the trade, i.e. which routes and how much is swapped in each that
   * make up the trade.
   */
  public readonly swaps: {
    route: Route<TInput, TOutput>;
    inputAmount: CurrencyAmount<TInput>;
    outputAmount: CurrencyAmount<TOutput>;
  }[];

  /**
   * The type of the trade, either exact in or exact out.
   */
  public readonly tradeType: TTradeType;

  /**
   * The cached result of the input amount computation
   * @private
   */
  private _inputAmount: CurrencyAmount<TInput> | undefined;

  /**
   * The input amount for the trade assuming no slippage.
   */
  public get inputAmount(): CurrencyAmount<TInput> {
    if (this._inputAmount) {
      return this._inputAmount;
    }

    const inputCurrency = this.swaps[0].inputAmount.currency;

    // Ensure the initial value is a CurrencyAmount<TInput>
    this._inputAmount = this.swaps
      .map(({ inputAmount }) => inputAmount)
      .reduce(
        (total, cur) => total.add(cur),
        CurrencyAmount.fromRawAmount(inputCurrency, 0), // Make sure the initial value is a CurrencyAmount<TInput>
      );

    return this._inputAmount;
  }

  /**
   * The cached result of the output amount computation
   * @private
   */
  private _outputAmount: CurrencyAmount<TOutput> | undefined;

  /**
   * The output amount for the trade assuming no slippage.
   */
  public get outputAmount(): CurrencyAmount<TOutput> {
    if (this._outputAmount) {
      return this._outputAmount;
    }

    const outputCurrency = this.swaps[0].outputAmount.currency;
    this._outputAmount = this.swaps
      .map(({ outputAmount }) => outputAmount)
      .reduce((total, cur) => total.add(cur), CurrencyAmount.fromRawAmount(outputCurrency, 0));
    return this._outputAmount;
  }

  /**
   * The cached result of the computed execution price
   * @private
   */
  private _executionPrice: Price<TInput, TOutput> | undefined;

  /**
   * The price expressed in terms of output amount/input amount.
   */
  public get executionPrice(): Price<TInput, TOutput> {
    return (
      this._executionPrice ??
      (this._executionPrice = new Price(
        this.inputAmount.currency,
        this.outputAmount.currency,
        this.inputAmount.quotient,
        this.outputAmount.quotient,
      ))
    );
  }

  /**
   * The cached result of the price impact computation
   * @private
   */
  private _priceImpact: Percent | undefined;

  /**
   * Returns the percent difference between the route's mid price and the price impact
   */
  public get priceImpact(): Percent {
    if (this._priceImpact) {
      return this._priceImpact;
    }

    let spotOutputAmount = CurrencyAmount.fromRawAmount(this.outputAmount.currency, 0);
    for (const { route, inputAmount } of this.swaps) {
      const midPrice = route.midPrice;
      spotOutputAmount = spotOutputAmount.add(midPrice.quote(inputAmount));
    }

    const priceImpact = spotOutputAmount.subtract(this.outputAmount).divide(spotOutputAmount);
    this._priceImpact = new Percent(priceImpact.numerator, priceImpact.denominator);

    return this._priceImpact;
  }

  /**
   * Constructs a trade by simulating swaps through the given route
   * @template TInput The input token, either Ether or an ERC-20.
   * @template TOutput The output token, either Ether or an ERC-20.
   * @template TTradeType The type of the trade, either exact in or exact out.
   * @param route route to swap through
   * @param amount the amount specified, either input or output, depending on tradeType
   * @param tradeType whether the trade is an exact input or exact output swap
   * @returns The route
   */
  public static async fromRoute<
    TInput extends Currency,
    TOutput extends Currency,
    TTradeType extends TradeType,
  >(
    route: Route<TInput, TOutput>,
    amount: TTradeType extends TradeType.EXACT_INPUT
      ? CurrencyAmount<TInput>
      : CurrencyAmount<TOutput>,
    tradeType: TTradeType,
  ): Promise<Trade<TInput, TOutput, TTradeType>> {
    const amounts: CurrencyAmount<Token>[] = new Array(route.tokenPath.length);
    let inputAmount: CurrencyAmount<TInput>;
    let outputAmount: CurrencyAmount<TOutput>;
    if (tradeType === TradeType.EXACT_INPUT) {
      invariant(amount.currency.equals(route.input), "INPUT");
      amounts[0] = amount.wrapped;
      for (let i = 0; i < route.tokenPath.length - 1; i++) {
        const pool = route.pools[i];
        console.log({
          sqrtPriceX96: pool.sqrtRatioX96.toString(),
          tick: pool.tickCurrent,
          liquidity: pool.liquidity.toString(),
        });

        const [outputAmount] = await pool.getOutputAmount(amounts[i]);
        amounts[i + 1] = outputAmount;
      }
      inputAmount = CurrencyAmount.fromFractionalAmount(
        route.input,
        amount.numerator,
        amount.denominator,
      );
      outputAmount = CurrencyAmount.fromFractionalAmount(
        route.output,
        amounts[amounts.length - 1].numerator,
        amounts[amounts.length - 1].denominator,
      );
    } else {
      invariant(amount.currency.equals(route.output), "OUTPUT");
      amounts[amounts.length - 1] = amount.wrapped;
      for (let i = route.tokenPath.length - 1; i > 0; i--) {
        const pool = route.pools[i - 1];
        const [inputAmount] = await pool.getInputAmount(amounts[i]);
        amounts[i - 1] = inputAmount;
      }
      inputAmount = CurrencyAmount.fromFractionalAmount(
        route.input,
        amounts[0].numerator,
        amounts[0].denominator,
      );
      outputAmount = CurrencyAmount.fromFractionalAmount(
        route.output,
        amount.numerator,
        amount.denominator,
      );
    }

    return new Trade({
      routes: [{ inputAmount, outputAmount, route }],
      tradeType,
    });
  }

  /**
   * Constructs a trade from routes by simulating swaps
   *
   * @template TInput The input token, either Ether or an ERC-20.
   * @template TOutput The output token, either Ether or an ERC-20.
   * @template TTradeType The type of the trade, either exact in or exact out.
   * @param routes the routes to swap through and how much of the amount should be routed through each
   * @param tradeType whether the trade is an exact input or exact output swap
   * @returns The trade
   */
  public static async fromRoutes<
    TInput extends Currency,
    TOutput extends Currency,
    TTradeType extends TradeType,
  >(
    routes: {
      amount: TTradeType extends TradeType.EXACT_INPUT
        ? CurrencyAmount<TInput>
        : CurrencyAmount<TOutput>;
      route: Route<TInput, TOutput>;
    }[],
    tradeType: TTradeType,
  ): Promise<Trade<TInput, TOutput, TTradeType>> {
    const populatedRoutes: {
      route: Route<TInput, TOutput>;
      inputAmount: CurrencyAmount<TInput>;
      outputAmount: CurrencyAmount<TOutput>;
    }[] = [];

    for (const { route, amount } of routes) {
      const amounts: CurrencyAmount<Token>[] = new Array(route.tokenPath.length);
      let inputAmount: CurrencyAmount<TInput>;
      let outputAmount: CurrencyAmount<TOutput>;

      if (tradeType === TradeType.EXACT_INPUT) {
        invariant(amount.currency.equals(route.input), "INPUT");
        inputAmount = CurrencyAmount.fromFractionalAmount(
          route.input,
          amount.numerator,
          amount.denominator,
        );
        amounts[0] = CurrencyAmount.fromFractionalAmount(
          route.input.wrapped,
          amount.numerator,
          amount.denominator,
        );

        for (let i = 0; i < route.tokenPath.length - 1; i++) {
          const pool = route.pools[i];
          const [outputAmount] = await pool.getOutputAmount(amounts[i]);
          amounts[i + 1] = outputAmount;
        }

        outputAmount = CurrencyAmount.fromFractionalAmount(
          route.output,
          amounts[amounts.length - 1].numerator,
          amounts[amounts.length - 1].denominator,
        );
      } else {
        invariant(amount.currency.equals(route.output), "OUTPUT");
        outputAmount = CurrencyAmount.fromFractionalAmount(
          route.output,
          amount.numerator,
          amount.denominator,
        );
        amounts[amounts.length - 1] = CurrencyAmount.fromFractionalAmount(
          route.output.wrapped,
          amount.numerator,
          amount.denominator,
        );

        for (let i = route.tokenPath.length - 1; i > 0; i--) {
          const pool = route.pools[i - 1];
          const [inputAmount] = await pool.getInputAmount(amounts[i]);
          amounts[i - 1] = inputAmount;
        }

        inputAmount = CurrencyAmount.fromFractionalAmount(
          route.input,
          amounts[0].numerator,
          amounts[0].denominator,
        );
      }

      populatedRoutes.push({ route, inputAmount, outputAmount });
    }

    return new Trade({
      routes: populatedRoutes,
      tradeType,
    });
  }

  /**
   * Creates a trade without computing the result of swapping through the route. Useful when you have simulated the trade
   * elsewhere and do not have any tick data
   * @template TInput The input token, either Ether or an ERC-20
   * @template TOutput The output token, either Ether or an ERC-20
   * @template TTradeType The type of the trade, either exact in or exact out
   * @param constructorArguments The arguments passed to the trade constructor
   * @returns The unchecked trade
   */
  public static createUncheckedTrade<
    TInput extends Currency,
    TOutput extends Currency,
    TTradeType extends TradeType,
  >(constructorArguments: {
    route: Route<TInput, TOutput>;
    inputAmount: CurrencyAmount<TInput>;
    outputAmount: CurrencyAmount<TOutput>;
    tradeType: TTradeType;
  }): Trade<TInput, TOutput, TTradeType> {
    return new Trade({
      ...constructorArguments,
      routes: [
        {
          inputAmount: constructorArguments.inputAmount,
          outputAmount: constructorArguments.outputAmount,
          route: constructorArguments.route,
        },
      ],
    });
  }

  /**
   * Creates a trade without computing the result of swapping through the routes. Useful when you have simulated the trade
   * elsewhere and do not have any tick data
   * @template TInput The input token, either Ether or an ERC-20
   * @template TOutput The output token, either Ether or an ERC-20
   * @template TTradeType The type of the trade, either exact in or exact out
   * @param constructorArguments The arguments passed to the trade constructor
   * @returns The unchecked trade
   */
  public static createUncheckedTradeWithMultipleRoutes<
    TInput extends Currency,
    TOutput extends Currency,
    TTradeType extends TradeType,
  >(constructorArguments: {
    routes: {
      route: Route<TInput, TOutput>;
      inputAmount: CurrencyAmount<TInput>;
      outputAmount: CurrencyAmount<TOutput>;
    }[];
    tradeType: TTradeType;
  }): Trade<TInput, TOutput, TTradeType> {
    return new Trade(constructorArguments);
  }

  /**
   * Construct a trade by passing in the pre-computed property values
   * @param routes The routes through which the trade occurs
   * @param tradeType The type of trade, exact input or exact output
   */
  private constructor({
    routes,
    tradeType,
  }: {
    routes: {
      route: Route<TInput, TOutput>;
      inputAmount: CurrencyAmount<TInput>;
      outputAmount: CurrencyAmount<TOutput>;
    }[];
    tradeType: TTradeType;
  }) {
    const inputCurrency = routes[0].inputAmount.currency;
    const outputCurrency = routes[0].outputAmount.currency;
    invariant(
      routes.every(({ route }) => inputCurrency.equals(route.input)),
      "INPUT_CURRENCY_MATCH",
    );
    invariant(
      routes.every(({ route }) => outputCurrency.equals(route.output)),
      "OUTPUT_CURRENCY_MATCH",
    );

    const numPools = routes
      .map(({ route }) => route.pools.length)
      .reduce((total, cur) => total + cur, 0);
    const poolAddressSet = new Set<string>();
    for (const { route } of routes) {
      for (const pool of route.pools) {
        poolAddressSet.add(
          // TODO Change it
          computePoolAddress({
            factoryAddress: FACTORY_ADDRESS[DexChainId.SEPOLIA],
            fee: pool.fee,
            tokenA: pool.token0.wrapped,
            tokenB: pool.token1.wrapped,
            standardA: Standard.ERC20, // TODO,
            standardB: Standard.ERC20, // TODO,
          }),
        );
      }
    }

    invariant(numPools == poolAddressSet.size, "POOLS_DUPLICATED");

    this.swaps = routes;
    this.tradeType = tradeType;
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount out
   */
  public minimumAmountOut(
    slippageTolerance: Percent,
    amountOut = this.outputAmount,
  ): CurrencyAmount<TOutput> {
    invariant(!slippageTolerance.lessThan(ZERO), "SLIPPAGE_TOLERANCE");
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return amountOut;
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(amountOut.quotient).quotient;
      return CurrencyAmount.fromRawAmount(amountOut.currency, slippageAdjustedAmountOut);
    }
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount in
   */
  public maximumAmountIn(
    slippageTolerance: Percent,
    amountIn = this.inputAmount,
  ): CurrencyAmount<TInput> {
    invariant(!slippageTolerance.lessThan(ZERO), "SLIPPAGE_TOLERANCE");
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return amountIn;
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE)
        .add(slippageTolerance)
        .multiply(amountIn.quotient).quotient;
      return CurrencyAmount.fromRawAmount(amountIn.currency, slippageAdjustedAmountIn);
    }
  }

  /**
   * Return the execution price after accounting for slippage tolerance
   * @param slippageTolerance the allowed tolerated slippage
   * @returns The execution price
   */
  public worstExecutionPrice(slippageTolerance: Percent): Price<TInput, TOutput> {
    return new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.maximumAmountIn(slippageTolerance).quotient,
      this.minimumAmountOut(slippageTolerance).quotient,
    );
  }

  /**
   * Given a list of pools, and a fixed amount in, returns the top `maxNumResults` trades that go from an input token
   * amount to an output token, making at most `maxHops` hops.
   * Note this does not consider aggregation, as routes are linear. It's possible a better route exists by splitting
   * the amount in among multiple routes.
   * @param pools the pools to consider in finding the best trade
   * @param nextAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param maxNumResults maximum number of results to return
   * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pool
   * @param currentPools used in recursion; the current list of pools
   * @param currencyAmountIn used in recursion; the original value of the currencyAmountIn parameter
   * @param bestTrades used in recursion; the current list of best trades
   * @returns The exact in trade
   */
  public static async bestTradeExactIn<TInput extends Currency, TOutput extends Currency>(
    pools: Pool[],
    currencyAmountIn: CurrencyAmount<TInput>,
    currencyOut: TOutput,
    { maxNumResults = 3, maxHops = 3 }: BestTradeOptions = {},
    // used in recursion.
    currentPools: Pool[] = [],
    nextAmountIn: CurrencyAmount<Currency> = currencyAmountIn,
    bestTrades: Trade<TInput, TOutput, TradeType.EXACT_INPUT>[] = [],
  ): Promise<Trade<TInput, TOutput, TradeType.EXACT_INPUT>[]> {
    invariant(pools.length > 0, "POOLS");
    invariant(maxHops > 0, "MAX_HOPS");
    invariant(currencyAmountIn === nextAmountIn || currentPools.length > 0, "INVALID_RECURSION");

    const amountIn = nextAmountIn.wrapped;
    const tokenOut = currencyOut.wrapped;
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i];
      // pool irrelevant
      if (
        !pool.token0.wrapped.equals(amountIn.currency) &&
        !pool.token1.wrapped.equals(amountIn.currency)
      )
        continue;

      let amountOut: CurrencyAmount<Token>;
      try {
        [amountOut] = await pool.getOutputAmount(amountIn);
        console.log(`Amount out for ${pool.fee} pool is:`);
        console.log(amountOut);
        console.log(amountOut.toSignificant());
      } catch (error: any) {
        console.log(error);
        // just skip this pool and keep going
        continue;
      }
      // we have arrived at the output token, so this is the final trade of one of the paths
      if (amountOut.currency.isToken && amountOut.currency.equals(tokenOut)) {
        sortedInsert(
          bestTrades,
          await Trade.fromRoute(
            new Route([...currentPools, pool], currencyAmountIn.currency, currencyOut),
            currencyAmountIn,
            TradeType.EXACT_INPUT,
          ),
          maxNumResults,
          tradeComparator,
        );
      } else if (maxHops > 1 && pools.length > 1) {
        const poolsExcludingThisPool = pools.slice(0, i).concat(pools.slice(i + 1, pools.length));

        // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
        await Trade.bestTradeExactIn(
          poolsExcludingThisPool,
          currencyAmountIn,
          currencyOut,
          {
            maxNumResults,
            maxHops: maxHops - 1,
          },
          [...currentPools, pool],
          amountOut,
          bestTrades,
        );
      }
    }

    return bestTrades;
  }
}
