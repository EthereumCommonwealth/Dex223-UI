import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";
import { Address } from "viem";

import {
  GqlOrder,
  GqlPosition,
  serializeGqlOrder,
  serializeGqlPosition,
} from "@/app/[locale]/margin-trading/hooks/helpers";
import {
  GQL_ORDER_FIELDS,
  GQL_POSITION_FIELDS,
} from "@/app/[locale]/margin-trading/hooks/queryParts";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import { SortingType } from "@/components/buttons/IconButton";
import daysToSeconds from "@/functions/daysToSeconds";
import { chainToApolloClient } from "@/graphql/thegraph/apollo";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useMarginModuleApolloClient from "@/hooks/useMarginModuleApolloClient";
import { DexChainId } from "@/sdk_bi/chains";

const queryAllOrders = gql`
  query GetOrders($orderBy: String, $orderDirection: String, $where: Order_filter) {
    orders(orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
      ${GQL_ORDER_FIELDS}
      positions {
        ${GQL_POSITION_FIELDS}
      }
    }
  }
`;

const queryOwner = gql(`
  query GetOrders($owner: String!) {
    orders(where: {owner: $owner}) {
      ${GQL_ORDER_FIELDS}
      positions {
        ${GQL_POSITION_FIELDS}
      }
    }
  }
`);

const queryId = gql(`
  query GetOrders($id: Int!) {
    order(id: $id) {
      ${GQL_ORDER_FIELDS}
      positions {
        ${GQL_POSITION_FIELDS}
      }
    }
  }
`);

export function useOrder({ id }: { id: number }): {
  loading: boolean;
  order: LendingOrder | undefined;
  refetch: any;
} {
  const apolloClient = useMarginModuleApolloClient();
  const chainId = useCurrentChainId();

  const { data, loading, refetch } = useQuery<any, any>(queryId, {
    variables: {
      id,
    },
    skip: !apolloClient,
    pollInterval: 30000,
    client: apolloClient || chainToApolloClient[DexChainId.SEPOLIA],
  });

  const order = useMemo(() => {
    if (!data) {
      return data;
    }

    return {
      ...serializeGqlOrder(data.order, chainId),
      positions: data.order.positions.map((position: GqlPosition) => {
        return serializeGqlPosition(position, chainId);
      }),
    };
  }, [chainId, data]);

  return { loading, order, refetch };
}

export function useOrders({
  sortingDirection,
  orderBy,
  leverage_lte,
  currencyLimit_lte,
  duration_lte,
  duration_gte,
  interestRate_lte,
  minLoanFormatted_gte,
  balanceFormatted_gte,
}: {
  sortingDirection: SortingType;
  orderBy: string;
  leverage_lte: string;
  currencyLimit_lte?: string;
  duration_lte?: string;
  duration_gte?: string;
  interestRate_lte?: string;
  minLoanFormatted_gte?: string;
  balanceFormatted_gte?: string;
}): {
  loading: boolean;
  orders: LendingOrder[];
} {
  const apolloClient = useMarginModuleApolloClient();
  const chainId = useCurrentChainId();

  const where = useMemo(() => {
    const f: Record<string, number> = {};

    // helper to turn "" or undefined into undefined, else +string
    const toNum = (raw?: string) => {
      if (!raw || raw.trim() === "") return undefined;
      const n = Number(raw);
      return isNaN(n) ? undefined : n;
    };

    const lev = toNum(leverage_lte);
    if (lev != null) f.leverage_lte = lev;

    const minLoanF = toNum(minLoanFormatted_gte);
    if (minLoanF != null) f.minLoanFormatted_gte = minLoanF;

    const minBalanceF = toNum(balanceFormatted_gte);
    if (minBalanceF != null) f.balanceFormatted_gte = minBalanceF;

    const curLim = toNum(currencyLimit_lte);
    if (curLim != null) f.currencyLimit_lte = curLim;

    const durL = toNum(duration_lte);
    if (durL != null) f.duration_lte = daysToSeconds(durL);

    const durG = toNum(duration_gte);
    if (durG != null) f.duration_gte = daysToSeconds(durG);

    const ir = toNum(interestRate_lte);
    if (ir != null) f.interestRate_lte = ir;

    return f;
  }, [
    leverage_lte,
    minLoanFormatted_gte,
    balanceFormatted_gte,
    currencyLimit_lte,
    duration_lte,
    duration_gte,
    interestRate_lte,
  ]);

  const { data, loading } = useQuery<any, any>(queryAllOrders, {
    variables: {
      orderBy: sortingDirection !== SortingType.NONE ? orderBy : undefined,
      orderDirection: sortingDirection !== SortingType.NONE ? sortingDirection : undefined,
      where,
    },
    skip: !apolloClient,
    pollInterval: 30000,
    client: apolloClient || chainToApolloClient[DexChainId.SEPOLIA],
  });

  const orders = useMemo(() => {
    if (!data) {
      return data;
    }

    console.log(data.orders);

    return data.orders.map((order: GqlOrder) => {
      return {
        ...serializeGqlOrder(order, chainId),
        positions: order.positions.map((position: GqlPosition) => {
          return serializeGqlPosition(position, chainId);
        }),
      };
    });
  }, [chainId, data]);

  return { loading, orders };
}

export function useOrdersByOwner({ owner }: { owner: Address | undefined }): {
  loading: boolean;
  orders: LendingOrder[];
} {
  const apolloClient = useMarginModuleApolloClient();
  const chainId = useCurrentChainId();

  const { data, loading } = useQuery<any, any>(queryOwner, {
    variables: {
      owner,
    },
    skip: !apolloClient || !owner,
    pollInterval: 30000,
    client: apolloClient || chainToApolloClient[DexChainId.SEPOLIA],
  });

  const orders = useMemo(() => {
    if (!data) {
      return data;
    }

    return data.orders.map((order: GqlOrder) => {
      return {
        ...serializeGqlOrder(order, chainId),
        positions: order.positions.map((position: GqlPosition) => {
          return serializeGqlPosition(position, chainId);
        }),
      };
    });
  }, [chainId, data]);

  return { loading, orders };
}
