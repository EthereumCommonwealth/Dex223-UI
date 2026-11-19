import Alert from "@repo/ui/alert";
import Checkbox from "@repo/ui/checkbox";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Address } from "viem";
import { useAccount, useSwitchChain } from "wagmi";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import TrustBadge, { TrustAddress } from "@/components/badges/TrustBadge";
import Button, { ButtonColor, ButtonVariant } from "@/components/buttons/Button";
import { useConnectWalletStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { useImportToken } from "@/components/manage-tokens/ImportToken";
import { networkInfo, networks } from "@/config/networks";
import { addCustomToken } from "@/db/addCustomToken";
import { TokenList } from "@/db/db";
import {
  cancelLinkImport,
  confirmLinkImport,
  describeLink,
  LinkTokenParam,
  LinkTokenRequest,
  preflightLinkToken,
  selectLinkToken,
} from "@/functions/importLink";
import { findInList, TokenTrust } from "@/functions/tokenTrust";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { tokenTrustFromLists, useSwapTokens, useTokenLists } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { DexChainId } from "@/sdk_bi/chains";
import { Currency } from "@/sdk_bi/entities/currency";
import { Token } from "@/sdk_bi/entities/token";
import { Standard } from "@/sdk_bi/standard";

// /add link import (#139, Figma page 31 section 182:726). Nothing is written to the token lists
// until the user presses Import here. Decision order: valid address, link network, already in any
// list, read on chain, ERC-777, trust check, dialog.

interface Props {
  request: LinkTokenRequest | null;
  index: number;
  total: number;
  openedLink: string;
  selectLinkToken: (param: LinkTokenParam, token: Currency) => void;
  removeLinkParam: (param: LinkTokenParam) => void;
  finishLinkRequest: () => void;
}

export default function ImportFromLinkDialog(props: Props) {
  const { request, removeLinkParam, finishLinkRequest } = props;

  // Don't import, Don't use, Close, the close button, Esc and a backdrop click: nothing is saved
  // and the token parameter leaves the URL.
  const cancel = () => {
    if (!request) return;
    cancelLinkImport(request.param, { removeParam: removeLinkParam });
    finishLinkRequest();
  };

  return (
    <DrawerDialog isOpen={!!request} setIsOpen={(isOpen) => !isOpen && cancel()}>
      {request && (
        <ImportFromLinkContent
          key={`${request.param}:${request.value}`}
          {...props}
          request={request}
          onCancel={cancel}
        />
      )}
    </DrawerDialog>
  );
}

type ReadState =
  | { kind: "loading" }
  | { kind: "not_a_token" }
  | { kind: "erc777" }
  | { kind: "token"; token: Token };

function networkName(chainId: number) {
  return networkInfo[chainId as DexChainId]?.name ?? String(chainId);
}

function asToken(entry: Token, known: Currency[]): Token {
  const found = known.find(
    (c): c is Token => c.isToken && c.address0.toLowerCase() === entry.address0.toLowerCase(),
  );
  return (
    found ??
    new Token(
      entry.chainId,
      entry.address0,
      entry.address1,
      entry.decimals,
      entry.symbol,
      entry.name,
      entry.logoURI,
    )
  );
}

function ImportFromLinkContent({
  request,
  index,
  total,
  openedLink,
  selectLinkToken: onSelect,
  removeLinkParam,
  finishLinkRequest,
  onCancel,
}: Props & { request: LinkTokenRequest; onCancel: () => void }) {
  const t = useTranslations("ManageTokens");
  const currentChainId = useCurrentChainId();
  const lists = useTokenLists();
  const { tokens: known } = useSwapTokens();
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
  const { readTokenFromChain } = useImportToken(request.chainId as DexChainId);
  const { isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { setChainToConnect } = useConnectWalletStore();

  const preflight = preflightLinkToken(
    request,
    currentChainId,
    networks.map((network) => network.chainId),
  );

  // Already in any of the user's lists (default, Core, Free, Custom or imported, enabled or not)?
  const listed = useMemo((): { token: Token; list: TokenList } | null | undefined => {
    if (preflight.kind !== "ok" || !lists) return undefined;
    const probe = { address0: request.value, address1: request.value };
    for (const list of lists) {
      const entry = findInList(list, probe);
      if (entry) return { token: asToken(entry, known), list };
    }
    return null;
  }, [known, lists, preflight.kind, request.value]);

  const [read, setRead] = useState<ReadState>({ kind: "loading" });
  useEffect(() => {
    if (preflight.kind !== "ok" || listed !== null) return;
    let cancelled = false;
    setRead({ kind: "loading" });
    readTokenFromChain(request.value as Address, request.chainId as DexChainId).then((result) => {
      if (cancelled) return;
      if (result?.status === "ok") setRead({ kind: "token", token: result.token });
      else if (result?.status === "erc777") setRead({ kind: "erc777" });
      else setRead({ kind: "not_a_token" });
    });
    return () => {
      cancelled = true;
    };
  }, [listed, preflight.kind, readTokenFromChain, request.chainId, request.value]);

  const token = listed ? listed.token : read.kind === "token" ? read.token : undefined;
  const trust = useMemo(
    () =>
      token && lists ? tokenTrustFromLists(token, lists, request.chainId as DexChainId) : undefined,
    [lists, request.chainId, token],
  );

  // Official and Core listed tokens from the lists skip the dialog and are selected directly.
  const selectDirectly = !!listed && (trust?.reason === "official" || trust?.reason === "core");
  useEffect(() => {
    if (selectDirectly && listed) {
      selectLinkToken(request.param, listed.token, { select: onSelect });
      finishLinkRequest();
    }
  }, [finishLinkRequest, listed, onSelect, request.param, selectDirectly]);

  const title =
    total > 1 ? t("import_from_link_title_of", { index, total }) : t("import_from_link_title");
  const header = (text: ReactNode) => <DialogHeader onClose={onCancel} title={text} />;

  const switchNetwork = async () => {
    if (isConnected && switchChainAsync) {
      try {
        await switchChainAsync({ chainId: request.chainId });
      } catch {
        // The wallet refused; the dialog stays on the network mismatch.
      }
    } else {
      setChainToConnect(request.chainId as DexChainId);
    }
  };

  const shell = (children: ReactNode, heading: ReactNode = title) => (
    <div className="w-full md:w-[600px]">
      {header(heading)}
      <div className="card-spacing-x pb-4 md:pb-10 flex flex-col gap-4">{children}</div>
    </div>
  );

  if (preflight.kind === "invalid_address") {
    return shell(
      <Message
        title={t("link_invalid_address")}
        text={t("link_invalid_address_text", {
          param: request.param,
          value: request.value.slice(0, 42),
        })}
        actions={<Button onClick={onCancel}>{t("close")}</Button>}
      />,
    );
  }

  if (preflight.kind === "unsupported_network") {
    return shell(
      <Message
        title={t("link_unsupported_network")}
        text={t("link_unsupported_network_text", { chainId: request.chainId })}
        actions={<Button onClick={onCancel}>{t("close")}</Button>}
      />,
    );
  }

  if (preflight.kind === "wrong_network") {
    const linkNetwork = networkName(request.chainId);
    const current = networkName(currentChainId);
    return shell(
      <Message
        title={t("link_wrong_network", { network: linkNetwork })}
        text={t("link_wrong_network_text", {
          network: linkNetwork,
          chainId: request.chainId,
          current,
        })}
        actions={
          <>
            <Button onClick={switchNetwork}>
              {t("switch_to_network", { network: linkNetwork })}
            </Button>
            <Button
              variant={ButtonVariant.OUTLINED}
              colorScheme={ButtonColor.GREEN}
              onClick={onCancel}
            >
              {t("stay_on_network", { network: current })}
            </Button>
          </>
        }
      />,
    );
  }

  if (selectDirectly) return null;

  if (!listed && read.kind === "not_a_token") {
    return shell(
      <Message
        title={t("link_not_a_token")}
        text={t("link_not_a_token_text", {
          address: `${request.value.slice(0, 6)}...${request.value.slice(-6)}`,
          network: networkName(request.chainId),
        })}
        actions={<Button onClick={onCancel}>{t("close")}</Button>}
      />,
    );
  }

  if (!listed && read.kind === "erc777") {
    return shell(
      <>
        <Alert text={t("erc777_warning")} type="error" />
        <Button onClick={onCancel}>{t("close")}</Button>
      </>,
    );
  }

  if (!token || !trust) {
    return shell(
      <>
        <p className="text-14 text-secondary-text">{t("import_from_link_intro")}</p>
        <div className="bg-secondary-bg rounded-3 p-4 flex flex-col gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-quaternary-bg" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-[140px] rounded-1 bg-quaternary-bg" />
              <div className="h-3 w-[200px] rounded-1 bg-quaternary-bg" />
            </div>
          </div>
          <div className="h-3.5 rounded-1 bg-quaternary-bg" />
          <div className="h-3.5 rounded-1 bg-quaternary-bg" />
          <p className="text-12 text-tertiary-text">
            {t("reading_token", { network: networkName(request.chainId) })}
          </p>
        </div>
        <Button disabled>{t("import_token")}</Button>
        <Button variant={ButtonVariant.OUTLINED} colorScheme={ButtonColor.GREEN} onClick={onCancel}>
          {t("dont_import")}
        </Button>
      </>,
    );
  }

  const card = (
    <TokenCard
      token={token}
      trust={trust}
      network={networkName(request.chainId)}
      link={describeLink(openedLink)}
      isMobile={isMobile}
    />
  );
  const official = trust.official ? asToken(trust.official, known) : undefined;
  const lookalikeAlert = trust.reason === "lookalike" && official && (
    <Alert
      type="error"
      text={t("link_lookalike_warning", {
        match: trust.match ?? "name_and_symbol",
        officialName: official.name ?? "",
        officialSymbol: official.symbol ?? "",
        network: networkName(request.chainId),
        address: official.address0,
      })}
    />
  );
  const useOfficialButton = official && (
    <Button
      onClick={() => {
        selectLinkToken(request.param, official, { select: onSelect });
        finishLinkRequest();
      }}
    >
      {t("use_official_symbol", { symbol: official.symbol ?? "" })}
    </Button>
  );

  // State 5: the token is already in a list; only selecting it is offered.
  if (listed) {
    const isCustom = typeof listed.list.id === "string" && listed.list.id.startsWith("custom-");
    return shell(
      <>
        <p className="text-14 text-secondary-text">
          {t("token_from_link_intro", { list: listed.list.list.name })}
        </p>
        {card}
        {trust.reason === "lookalike" ? (
          <>
            {lookalikeAlert}
            {useOfficialButton}
          </>
        ) : (
          <Alert
            type="info"
            text={
              isCustom
                ? t("token_from_link_custom_warning")
                : t("token_from_link_list_warning", { list: listed.list.list.name })
            }
          />
        )}
        <Button
          variant={trust.reason === "lookalike" ? ButtonVariant.OUTLINED : undefined}
          colorScheme={trust.reason === "lookalike" ? ButtonColor.LIGHT_RED : undefined}
          onClick={() => {
            selectLinkToken(request.param, token, { select: onSelect });
            finishLinkRequest();
          }}
        >
          {t("use_symbol", { symbol: token.symbol ?? "" })}
        </Button>
        <Button variant={ButtonVariant.OUTLINED} colorScheme={ButtonColor.GREEN} onClick={onCancel}>
          {t("dont_use")}
        </Button>
      </>,
      t("token_from_link_title"),
    );
  }

  const importToken = async () => {
    await confirmLinkImport(request.param, token, {
      save: addCustomToken,
      select: onSelect,
      removeParam: removeLinkParam,
      notifyImported: () => addToast(t("imported_successfully")),
    });
    finishLinkRequest();
  };

  // State 4: a lookalike. The safe action comes first.
  if (trust.reason === "lookalike") {
    return shell(
      <>
        <p className="text-14 text-secondary-text">{t("import_from_link_intro")}</p>
        {card}
        {lookalikeAlert}
        {useOfficialButton}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-secondary-border" />
          <span className="text-12 text-tertiary-text">{t("or")}</span>
          <div className="flex-1 h-px bg-secondary-border" />
        </div>
        <AckCheckbox
          id="import-link-lookalike"
          label={t("link_lookalike_ack", { symbol: official?.symbol ?? token.symbol ?? "" })}
        >
          {(checked) => (
            <Button
              variant={ButtonVariant.OUTLINED}
              colorScheme={ButtonColor.LIGHT_RED}
              disabled={!checked}
              onClick={importToken}
            >
              {t("import_anyway")}
            </Button>
          )}
        </AckCheckbox>
      </>,
    );
  }

  // State 2: not verified. Same warning and "I understand" as the manual import path.
  return shell(
    <>
      <p className="text-14 text-secondary-text">{t("import_from_link_intro")}</p>
      {card}
      <Alert type="warning" text={t("link_import_warning")} />
      <AckCheckbox id="import-link-understand" label={t("i_understand")}>
        {(checked) => (
          <>
            <Button disabled={!checked} onClick={importToken}>
              {t("import_symbol", { symbol: token.symbol ?? "" })}
            </Button>
            <Button
              variant={ButtonVariant.OUTLINED}
              colorScheme={ButtonColor.GREEN}
              onClick={onCancel}
            >
              {t("dont_import")}
            </Button>
          </>
        )}
      </AckCheckbox>
    </>,
  );
}

function AckCheckbox({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: (checked: boolean) => ReactNode;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <>
      <Checkbox
        id={id}
        checked={checked}
        handleChange={() => setChecked(!checked)}
        label={label}
        labelClassName="text-primary-text"
      />
      {children(checked)}
    </>
  );
}

function Message({ title, text, actions }: { title: string; text: string; actions: ReactNode }) {
  return (
    <>
      <div className="flex flex-col items-center text-center gap-3 pt-4">
        <div className="w-20 h-20 flex items-center justify-center relative">
          <EmptyStateIcon iconName="warning" />
        </div>
        <p className="text-16 md:text-20 font-bold text-primary-text">{title}</p>
        <p className="text-14 text-secondary-text">{text}</p>
      </div>
      {actions}
    </>
  );
}

function TokenCard({
  token,
  trust,
  network,
  link,
  isMobile,
}: {
  token: Token;
  trust: TokenTrust<Token>;
  network: string;
  link: string;
  isMobile: boolean;
}) {
  const t = useTranslations("ManageTokens");
  const danger = trust.reason === "lookalike";
  const hasLogo = !!token.logoURI && !token.logoURI.endsWith("placeholder.svg");
  const address = (value: string) => (
    <TrustAddress
      address={value}
      chainId={token.chainId}
      full={!isMobile}
      chars={12}
      danger={danger}
    />
  );

  return (
    <div className="bg-secondary-bg rounded-3 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {hasLogo ? (
            <Image src={token.logoURI!} alt="" width={40} height={40} className="flex-shrink-0" />
          ) : (
            <span className="w-10 h-10 rounded-full bg-quaternary-bg flex items-center justify-center text-14 font-medium text-secondary-text flex-shrink-0">
              {(token.name || token.symbol || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-16 font-medium text-primary-text">{token.name}</span>
            <span className="text-14 text-secondary-text">
              {t("link_token_line", {
                symbol: token.symbol ?? "",
                decimals: token.decimals,
                network,
              })}
            </span>
            <span className="md:hidden mt-0.5">
              <TrustBadge token={token} trust={trust} />
            </span>
          </div>
        </div>
        <span className="hidden md:block">
          <TrustBadge token={token} trust={trust} />
        </span>
      </div>
      <div className="h-px bg-secondary-border" />
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2 text-14 text-secondary-text">
          {t("address")}
          <Badge size="small" variant={BadgeVariant.STANDARD} standard={Standard.ERC20} />
        </span>
        {address(token.address0)}
      </div>
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2 text-14 text-secondary-text">
          {t("address")}
          <Badge size="small" variant={BadgeVariant.STANDARD} standard={Standard.ERC223} />
        </span>
        {address(token.address1)}
      </div>
      {link && <p className="text-12 text-tertiary-text break-all">{t("from_link", { link })}</p>}
    </div>
  );
}
