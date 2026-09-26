import Preloader from "@repo/ui/preloader";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";

import LendingOrderCard from "@/app/[locale]/margin-trading/components/LendingOrderCard";
import { useOrdersByOwner } from "@/app/[locale]/margin-trading/hooks/useOrder";
import OrderDepositDialog from "@/app/[locale]/margin-trading/lending-order/[id]/components/OrderDepositDialog";
import OrderOpenDialog from "@/app/[locale]/margin-trading/lending-order/[id]/components/OrderOpenDialog";
import OrderWithdrawDialog from "@/app/[locale]/margin-trading/lending-order/[id]/components/OrderWithdrawDialog";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import { SearchInput } from "@/components/atoms/Input";
import { HelperText } from "@/components/atoms/TextField";

import OrderCloseDialog from "../lending-order/[id]/components/OrderCloseDialog";

export default function LendingOrdersTab() {
  const t = useTranslations("Margin");
  const { address, isConnected } = useAccount();
  const [searchValue, setSearchValue] = useState("");

  const { orders, loading } = useOrdersByOwner({
    owner: !!searchValue && isAddress(searchValue) ? searchValue : address,
  });

  const [orderToDeposit, setOrderToDeposit] = useState<LendingOrder | undefined>();
  const [orderToWithdraw, setOrderToWithdraw] = useState<LendingOrder | undefined>();
  const [orderToClose, setOrderToClose] = useState<LendingOrder | undefined>();
  const [orderToOpen, setOrderToOpen] = useState<LendingOrder | undefined>();

  return (
    <>
      <div className="flex justify-between my-5 items-center">
        {loading ? (
          <Preloader size={24} />
        ) : (
          <span className="text-20 text-tertiary-text">
            {t("lending_orders_count", { count: orders?.length || 0 })}
          </span>
        )}
        <div className="max-w-[460px] flex-grow">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("search_address")}
            className="bg-primary-bg"
            isError={!!searchValue && !isAddress(searchValue)}
          />
          <HelperText error={!!searchValue && !isAddress(searchValue) && t("invalid_address")} />
        </div>
      </div>

      {loading && (
        <div className="flex my-10 justify-center items-center min-h-[340px]">
          <Preloader size={96} />
        </div>
      )}
      {isConnected && !loading && orders?.length > 0 && (
        <div className="flex flex-col gap-5">
          {orders.map((order) => (
            <LendingOrderCard
              key={order.id}
              order={order}
              setOrderToDeposit={setOrderToDeposit}
              setOrderToWithdraw={setOrderToWithdraw}
              setOrderToClose={setOrderToClose}
              setOrderToOpen={setOrderToOpen}
            />
          ))}
        </div>
      )}
      {!loading && !orders?.length && !!searchValue && isAddress(searchValue) && (
        <div className="bg-primary-bg rounded-5 h-[340px] bg-empty-no-lendings-orders-yet bg-no-repeat bg-right-top max-md:bg-size-180 flex items-center gap-2 justify-center text-secondary-text">
          Lending orders for this address not found
        </div>
      )}
      {isConnected && !loading && !orders?.length && (!searchValue || !isAddress(searchValue)) && (
        <div className="bg-primary-bg rounded-5 h-[340px] bg-empty-no-lendings-orders-yet bg-no-repeat bg-right-top max-md:bg-size-180 flex items-center gap-2 justify-center text-secondary-text">
          Your lending orders will appear here
        </div>
      )}
      {!isConnected && !loading && (!searchValue || !isAddress(searchValue)) && (
        <div className="bg-primary-bg rounded-5 h-[340px] bg-empty-wallet bg-no-repeat bg-right-top max-md:bg-size-180 flex items-center gap-2 justify-center text-secondary-text">
          Search by address or connect wallet to view lending orders
        </div>
      )}

      <OrderCloseDialog
        isOpen={Boolean(orderToClose)}
        setIsOpen={() => setOrderToClose(undefined)}
        order={orderToClose}
      />
      <OrderOpenDialog
        isOpen={Boolean(orderToOpen)}
        setIsOpen={() => setOrderToOpen(undefined)}
        order={orderToOpen}
      />
      {orderToDeposit && (
        <OrderDepositDialog
          isOpen={Boolean(orderToDeposit)}
          setIsOpen={() => setOrderToDeposit(undefined)}
          order={orderToDeposit}
        />
      )}
      {orderToWithdraw && (
        <OrderWithdrawDialog
          isOpen={Boolean(orderToWithdraw)}
          setIsOpen={() => setOrderToWithdraw(undefined)}
          order={orderToWithdraw}
        />
      )}
    </>
  );

  // if (!loading && !orders.length) {
  //   return (

  //   );
  // }

  if (!orders) {
    return (
      <>
        <div className="flex justify-between my-5 items-center">
          <span className="text-20 text-tertiary-text">{t("loading")}</span>
          <div className="max-w-[460px] flex-grow">
            <SearchInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("search_address")}
              className="bg-primary-bg"
            />
          </div>
        </div>
        <div>{t("loading")}</div>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between my-5 items-center">
        <span className="text-20 text-tertiary-text">
          {t("lending_orders_count", { count: orders.length })}
        </span>
        <div className="max-w-[460px] flex-grow">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("search_address")}
            className="bg-primary-bg"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {orders.map((order) => (
          <LendingOrderCard
            key={order.id}
            order={order}
            setOrderToDeposit={setOrderToDeposit}
            setOrderToWithdraw={setOrderToWithdraw}
            setOrderToClose={setOrderToClose}
            setOrderToOpen={setOrderToOpen}
          />
        ))}
      </div>
    </>
  );
}
