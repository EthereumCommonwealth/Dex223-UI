import gql from "graphql-tag";

/**
 * Daily OHLC series for one pool.
 *
 * PoolDayData is already indexed and already read elsewhere in the app - the pools
 * table renders poolDayData[0].volumeUSD - so this widens a proven query from the most
 * recent day to a series rather than relying on a new entity.
 *
 * token0Price is the price of token0 denominated in token1. `close` is the last price
 * within the day and is what the line is drawn from; open/high/low come along so the
 * same query can back a candlestick view later without a schema change.
 */
export const PoolPriceChartQuery = gql`
  query PoolPriceChart($poolId: ID!, $days: Int!) {
    poolDayDatas(
      first: $days
      orderBy: date
      orderDirection: desc
      where: { pool: $poolId }
    ) {
      id
      date
      open
      high
      low
      close
      token0Price
      token1Price
      volumeUSD
    }
  }
`;
