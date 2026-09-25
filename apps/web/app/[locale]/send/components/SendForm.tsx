"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { type Address, formatUnits, type Hex, isAddress, parseUnits } from "viem";
import {
  useAccount,
  useBytecode,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWalletClient,
} from "wagmi";

import {
  balanceOfAbi,
  encodeInvoice,
  erc20Abi,
  erc223Abi,
  PAYMENT_RECEIVER,
  SAFE_SEND_ROUTER,
  SAFE_SEND_TOKENS,
  safeSendRouterAbi,
  SEPOLIA_CHAIN_ID,
  TOKEN_RECEIVED_SELECTOR,
  tokenBySymbol,
  tokenReceivedAbi,
} from "@/app/[locale]/send/config";
import Input from "@/components/atoms/Input";
import Button from "@/components/buttons/Button";
import { Link } from "@/i18n/routing";

type Hold = "223" | "20";
type Mode = "send" | "pay" | "invoice";

export default function SendForm({ mode }: { mode: Mode }) {
  const t = useTranslations("Send");
  const params = useSearchParams();
  const preset = tokenBySymbol(params.get("token") || "");
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [tokenKey, setTokenKey] = useState(preset?.index ?? 0);
  const [hold, setHold] = useState<Hold>("223");
  const [to, setTo] = useState(mode === "pay" ? params.get("to") || PAYMENT_RECEIVER : "");
  const [amount, setAmount] = useState(params.get("amount") || "");
  const [invoice, setInvoice] = useState(params.get("invoice") || "");
  const [hash, setHash] = useState<Hex | undefined>();
  const [localError, setLocalError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    isLoading: confirming,
    isSuccess,
    isError: reverted,
  } = useWaitForTransactionReceipt({ hash });
  const token = SAFE_SEND_TOKENS[tokenKey];
  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  const parsed = useMemo(() => {
    try {
      if (!amount) return null;
      return parseUnits(amount, token.decimals);
    } catch {
      return null;
    }
  }, [amount, token.decimals]);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token.erc20,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, SAFE_SEND_ROUTER] : undefined,
    query: { enabled: !!address && hold === "20" && onSepolia },
  });

  const { data: balance20, refetch: refetchBalance20 } = useReadContract({
    address: token.erc20,
    abi: balanceOfAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && onSepolia },
  });
  const { data: wrapperBalance, refetch: refetchBalance223 } = useReadContract({
    address: token.erc223,
    abi: balanceOfAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && onSepolia },
  });
  // The converter deploys a wrapper on the first wrap. Until then the ERC-223 address has no
  // code: reading it fails and a transfer to it succeeds without moving anything, so treat the
  // safe version as an empty balance.
  const { data: wrapperCode, isSuccess: wrapperChecked } = useBytecode({
    address: token.erc223,
    query: { enabled: onSepolia },
  });
  const wrapperMissing = wrapperChecked && (!wrapperCode || wrapperCode === "0x");
  const balance223 = wrapperMissing ? 0n : wrapperBalance;
  const heldBalance = hold === "223" ? balance223 : balance20;

  // Show the balances and allowance the transaction left behind.
  useEffect(() => {
    if (!isSuccess) return;
    refetchBalance20();
    refetchBalance223();
    refetchAllowance();
  }, [isSuccess, refetchAllowance, refetchBalance20, refetchBalance223]);

  // Default to the version the user actually holds, so nobody starts on an empty balance.
  useEffect(() => {
    if (balance20 === undefined || balance223 === undefined) return;
    if (balance223 === 0n && balance20 > 0n) setHold("20");
    else if (balance20 === 0n && balance223 > 0n) setHold("223");
  }, [tokenKey, balance20, balance223]);

  /**
   * A contract recipient must accept the token, or an ERC-223 transfer reverts. Ask the
   * recipient directly, as the token would, before the user signs anything.
   */
  async function recipientAccepts(recipient: Address, value: bigint, data: Hex) {
    if (!publicClient || !address) return true;
    const code = await publicClient.getCode({ address: recipient });
    if (!code || code === "0x") return true;
    try {
      const { result } = await publicClient.simulateContract({
        address: recipient,
        abi: tokenReceivedAbi,
        functionName: "tokenReceived",
        args: [address, value, data],
        account: token.erc223,
      });
      return result === TOKEN_RECEIVED_SELECTOR;
    } catch {
      return false;
    }
  }

  const payLink = useMemo(() => {
    const query = new URLSearchParams();
    if (to) query.set("to", to);
    query.set("token", token.symbol);
    if (amount) query.set("amount", amount);
    if (invoice.trim()) query.set("invoice", invoice.trim());
    return `/pay?${query.toString()}`;
  }, [amount, invoice, to, token.symbol]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);
    if (!isConnected || !address || !walletClient) {
      setLocalError(t("connect_first"));
      return;
    }
    if (!onSepolia) {
      setLocalError(t("sepolia_only"));
      return;
    }
    if (mode !== "invoice" && !isAddress(to)) {
      setLocalError(t("bad_address"));
      return;
    }
    if (mode !== "invoice" && (parsed == null || parsed <= 0n)) {
      setLocalError(t("bad_amount"));
      return;
    }
    if (mode === "invoice") return;
    if (heldBalance !== undefined && parsed! > heldBalance) {
      setLocalError(t("insufficient"));
      return;
    }

    const data = mode === "pay" ? encodeInvoice(invoice) : ("0x" as Hex);

    try {
      setPending(true);
      if (!(await recipientAccepts(to as Address, parsed!, data))) {
        setLocalError(t("blocked"));
        return;
      }
      if (hold === "223") {
        const tx = await walletClient.writeContract({
          address: token.erc223,
          abi: erc223Abi,
          functionName: "transfer",
          args: mode === "pay" ? [to as Address, parsed!, data] : [to as Address, parsed!],
        });
        setHash(tx);
        return;
      }

      if ((allowance ?? 0n) < parsed!) {
        const approveHash = await walletClient.writeContract({
          address: token.erc20,
          abi: erc20Abi,
          functionName: "approve",
          args: [SAFE_SEND_ROUTER, parsed!],
        });
        if (!publicClient) throw new Error(t("client_missing"));
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      const tx = await walletClient.writeContract({
        address: SAFE_SEND_ROUTER,
        abi: safeSendRouterAbi,
        functionName: "wrapAndSend",
        args: [token.erc20, to as Address, parsed!, data],
      });
      setHash(tx);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (/user rejected|user denied|rejected the request/i.test(message)) {
        setLocalError(t("cancelled"));
      } else if (/insufficient/i.test(message)) {
        setLocalError(t("insufficient"));
      } else {
        setLocalError(t("failed"));
      }
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    const origin = window.location.origin;
    const locale = window.location.pathname.split("/")[1] || "en";
    await navigator.clipboard.writeText(`${origin}/${locale}${payLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <form onSubmit={onSubmit} className="bg-primary-bg rounded-5 p-4 md:p-6 flex flex-col gap-4">
      <div className="flex gap-2 text-14">
        <Tab href="/send" active={mode === "send"} label={t("tab_send")} />
        <Tab href="/pay" active={mode === "pay"} label={t("tab_pay")} />
        <Tab href="/send/invoice" active={mode === "invoice"} label={t("tab_invoice")} />
      </div>

      <p className="text-14 text-secondary-text">
        {mode === "send" ? t("send_hint") : mode === "pay" ? t("pay_hint") : t("invoice_hint")}
      </p>

      {!onSepolia && isConnected && (
        <p className="text-14 text-yellow-light">{t("sepolia_only")}</p>
      )}

      <label className="flex flex-col gap-1.5 text-14 text-secondary-text">
        {mode === "send" ? t("recipient") : t("merchant")}
        <Input
          value={to}
          placeholder="0x…"
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => setTo(event.target.value.trim())}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-14 text-secondary-text">
        {t("token")}
        <select
          className="h-12 rounded-2 md:rounded-3 bg-secondary-bg px-4 text-16 text-primary-text"
          value={tokenKey}
          onChange={(event) => setTokenKey(Number(event.target.value))}
        >
          {SAFE_SEND_TOKENS.map((item, index) => (
            <option key={item.symbol} value={index}>
              {item.symbol} · {item.name}
            </option>
          ))}
        </select>
      </label>

      {mode !== "invoice" && (
        <label className="flex flex-col gap-1.5 text-14 text-secondary-text">
          {t("holding")}
          <select
            className="h-12 rounded-2 md:rounded-3 bg-secondary-bg px-4 text-16 text-primary-text"
            value={hold}
            onChange={(event) => setHold(event.target.value as Hold)}
          >
            <option value="223">{t("hold_safe")}</option>
            <option value="20">{t("hold_classic")}</option>
          </select>
        </label>
      )}

      {mode !== "send" && (
        <label className="flex flex-col gap-1.5 text-14 text-secondary-text">
          {t("invoice")}
          <Input
            value={invoice}
            placeholder="order-42"
            onChange={(event) => setInvoice(event.target.value)}
          />
        </label>
      )}

      {/* A div, not a label: a label would target the Max button instead of the input. */}
      <div className="flex flex-col gap-1.5 text-14 text-secondary-text">
        <span className="flex items-center justify-between gap-2">
          <label htmlFor="safe-send-amount">{t("amount")}</label>
          {mode !== "invoice" && heldBalance !== undefined && (
            <span className="flex items-center gap-2 tabular-nums">
              {t("balance")}: {formatUnits(heldBalance, token.decimals)} {token.symbol}
              <button
                type="button"
                className="text-green hocus:text-green-hover duration-200"
                onClick={() => setAmount(formatUnits(heldBalance, token.decimals))}
              >
                {t("max")}
              </button>
            </span>
          )}
        </span>
        <Input
          id="safe-send-amount"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      {mode === "invoice" ? (
        <Button type="button" onClick={copyLink} fullWidth>
          {copied ? t("copied") : t("copy_link")}
        </Button>
      ) : (
        <Button type="submit" fullWidth disabled={pending || confirming}>
          {pending || confirming ? t("confirming") : mode === "pay" ? t("pay") : t("send")}
        </Button>
      )}

      {localError && <p className="text-14 text-red-light break-words">{localError}</p>}
      {hash && reverted && <p className="text-14 text-red-light">{t("failed")}</p>}
      {hash && !reverted && (
        <a
          className="text-14 text-green"
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {isSuccess ? t("done") : t("submitted")}
        </a>
      )}
    </form>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "px-3 py-1.5 rounded-2 bg-green text-black"
          : "px-3 py-1.5 rounded-2 text-secondary-text hocus:text-primary-text"
      }
    >
      {label}
    </Link>
  );
}
