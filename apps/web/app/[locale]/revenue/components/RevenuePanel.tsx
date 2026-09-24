"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Address, formatUnits, isAddress, zeroAddress } from "viem";
import { useAccount } from "wagmi";

import {
  usePendingClaim,
  useRevenueActions,
  useRevenueReads,
} from "@/app/[locale]/revenue/hooks/useRevenue";
import TextField from "@/components/atoms/TextField";
import Button, { ButtonSize, ButtonVariant } from "@/components/buttons/Button";
function formatDuration(seconds: bigint): string {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return "—";
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((s % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatCountdown(unlockAt: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const left = Number(unlockAt) - now;
  if (left <= 0) return "unlocked";
  return formatDuration(BigInt(left));
}

export default function RevenuePanel() {
  const t = useTranslations("Revenue");
  const { address, isConnected } = useAccount();
  const reads = useRevenueReads(address);
  const actions = useRevenueActions();
  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [claimToken, setClaimToken] = useState("");
  const claimTokenAddr = isAddress(claimToken) ? (claimToken as Address) : undefined;
  const pending = usePendingClaim(claimTokenAddr, address);

  const unlockAt = reads.stakingTimestamp > 0n ? reads.stakingTimestamp + reads.claimDelay : 0n;
  const frozen = unlockAt > 0n && BigInt(Math.floor(Date.now() / 1000)) < unlockAt;

  const stakedHuman = useMemo(
    () => formatUnits(reads.userStaked, reads.decimals),
    [reads.userStaked, reads.decimals],
  );
  const totalHuman = useMemo(
    () => formatUnits(reads.totalStaked, reads.decimals),
    [reads.totalStaked, reads.decimals],
  );

  if (!reads.revenueAddress) {
    return (
      <div className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6 flex flex-col gap-3">
        <p className="text-16 text-secondary-text">{t("not_deployed")}</p>
        <p className="text-14 text-tertiary-text">{t("not_deployed_hint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <section className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6 flex flex-col gap-3">
        <h2 className="text-18 font-medium">{t("status_title")}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-14">
          <div>
            <dt className="text-tertiary-text">{t("your_stake")}</dt>
            <dd className="text-primary-text text-16">
              {stakedHuman} {reads.symbol}
            </dd>
          </div>
          <div>
            <dt className="text-tertiary-text">{t("total_staked")}</dt>
            <dd className="text-primary-text text-16">
              {totalHuman} {reads.symbol}
            </dd>
          </div>
          <div>
            <dt className="text-tertiary-text">{t("freeze")}</dt>
            <dd className="text-primary-text text-16">
              {reads.stakingTimestamp === 0n
                ? t("no_stake_yet")
                : frozen
                  ? t("frozen_until", { time: formatCountdown(unlockAt) })
                  : t("unlocked")}
            </dd>
          </div>
          <div>
            <dt className="text-tertiary-text">{t("claim_delay")}</dt>
            <dd className="text-primary-text text-16">{formatDuration(reads.claimDelay)}</dd>
          </div>
        </dl>
        <p className="text-12 text-tertiary-text">{t("restake_warning")}</p>
        <p className="text-12 text-tertiary-text">{t("rewards_hint")}</p>
      </section>

      <section className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6 flex flex-col gap-4">
        <h2 className="text-18 font-medium">{t("stake_title")}</h2>
        <p className="text-14 text-secondary-text">{t("stake_erc20_hint")}</p>
        <TextField
          label={t("amount")}
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="0.0"
          disabled={!isConnected}
        />
        <div className="flex flex-wrap gap-2 text-12 text-tertiary-text">
          <span>
            {t("wallet_balance")}: {formatUnits(reads.walletBalance20, reads.decimals)}{" "}
            {reads.symbol}
          </span>
        </div>
        <Button
          fullWidth
          size={ButtonSize.LARGE}
          disabled={!isConnected || Boolean(actions.pending)}
          isLoading={actions.pending === "Approve" || actions.pending === "Stake"}
          onClick={() => actions.approveAndStake20(stakeAmount)}
        >
          {t("stake_erc20")}
        </Button>
        <p className="text-12 text-tertiary-text">
          {t("stake_erc223_hint")}{" "}
          <code className="text-secondary-text break-all">{reads.stake223}</code>
        </p>
      </section>

      <section className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6 flex flex-col gap-4">
        <h2 className="text-18 font-medium">{t("withdraw_title")}</h2>
        <TextField
          label={t("amount")}
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="0.0"
          disabled={!isConnected || frozen}
        />
        <Button
          fullWidth
          size={ButtonSize.LARGE}
          variant={ButtonVariant.OUTLINED}
          disabled={!isConnected || frozen || Boolean(actions.pending)}
          isLoading={actions.pending === "Withdraw"}
          onClick={() => actions.withdraw(withdrawAmount, reads.stake20)}
        >
          {frozen ? t("withdraw_locked") : t("withdraw")}
        </Button>
      </section>

      <section className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6 flex flex-col gap-4">
        <h2 className="text-18 font-medium">{t("claim_title")}</h2>
        <p className="text-14 text-secondary-text">{t("claim_hint")}</p>
        <TextField
          label={t("reward_token")}
          value={claimToken}
          onChange={(e) => setClaimToken(e.target.value.trim())}
          placeholder="0x…"
          disabled={!isConnected}
        />
        {claimTokenAddr && !pending.blocked && (
          <p className="text-14 text-secondary-text">
            {t("estimated")}: {pending.dividends.toString()} wei
            {pending.periods === 0n && pending.nextPeriodAt
              ? ` · ${t("next_period", { time: formatCountdown(pending.nextPeriodAt) })}`
              : ""}
          </p>
        )}
        <Button
          fullWidth
          size={ButtonSize.LARGE}
          disabled={!isConnected || frozen || Boolean(actions.pending)}
          isLoading={actions.pending === "Claim"}
          onClick={() => claimTokenAddr && actions.claim([claimTokenAddr])}
        >
          {frozen ? t("claim_locked") : t("claim")}
        </Button>
      </section>

      {reads.deposit223 > 0n && reads.stake223 !== zeroAddress && (
        <section className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6 flex flex-col gap-3">
          <h2 className="text-18 font-medium">{t("deposit_title")}</h2>
          <p className="text-14 text-secondary-text">
            {t("deposit_hint", {
              amount: formatUnits(reads.deposit223, reads.decimals),
            })}
          </p>
          <Button
            fullWidth
            size={ButtonSize.LARGE}
            variant={ButtonVariant.OUTLINED}
            disabled={Boolean(actions.pending)}
            isLoading={actions.pending === "Recover deposit"}
            onClick={() => actions.withdrawDeposit(reads.stake223)}
          >
            {t("recover_deposit")}
          </Button>
        </section>
      )}
    </div>
  );
}
