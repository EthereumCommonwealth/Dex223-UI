import Alert from "@repo/ui/alert";
import ExternalTextLink from "@repo/ui/external-text-link";
import Image from "next/image";
import React, { useEffect, useMemo } from "react";

import useCreateToken from "@/app/[locale]/create-token/hooks/useCreateToken";
import { useCreateTokenDialogStore } from "@/app/[locale]/create-token/hooks/useCreateTokenDialogStore";
import {
  CreateTokenStatus,
  useCreateTokenStatusStore,
} from "@/app/[locale]/create-token/stores/useCreateTokenStatusStore";
import SwapDetailsRow from "@/app/[locale]/swap/components/SwapDetailsRow";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor } from "@/components/buttons/Button";
import OperationStepRow, {
  OperationRows,
  operationStatusToStepStatus,
  OperationStepStatus,
} from "@/components/common/OperationStepRow";
import { networks } from "@/config/networks";
import { IconName } from "@/config/types/IconName";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Link } from "@/i18n/routing";

type StepTextMap = {
  [key in OperationStepStatus]: string;
};

type OperationStepConfig = {
  iconName: IconName;
  textMap: StepTextMap;
  pending: CreateTokenStatus;
  loading: CreateTokenStatus;
  error: CreateTokenStatus;
};

function composeCreateTokensSteps(createWrapper: boolean): OperationStepConfig[] {
  const deployTokenStep: OperationStepConfig = {
    iconName: "deploy-token",
    pending: CreateTokenStatus.PENDING_CREATE_TOKEN,
    loading: CreateTokenStatus.LOADING_CREATE_TOKEN,
    error: CreateTokenStatus.ERROR_CREATE_TOKEN,
    textMap: {
      [OperationStepStatus.IDLE]: "Create new token",
      [OperationStepStatus.AWAITING_SIGNATURE]: "Confirm token creation",
      [OperationStepStatus.LOADING]: "Executing token creation",
      [OperationStepStatus.STEP_COMPLETED]: "Token created",
      [OperationStepStatus.STEP_FAILED]: "Failed to create token",
      [OperationStepStatus.OPERATION_COMPLETED]: "Token created",
    },
  };

  const createWrapperStep: OperationStepConfig = {
    iconName: "token-version",
    pending: CreateTokenStatus.PENDING_CREATE_WRAPPER,
    loading: CreateTokenStatus.LOADING_CREATE_WRAPPER,
    error: CreateTokenStatus.ERROR_CREATE_WRAPPER,
    textMap: {
      [OperationStepStatus.IDLE]: "Create ERC-20 version",
      [OperationStepStatus.AWAITING_SIGNATURE]: "Confirm creation of ERC-20 version",
      [OperationStepStatus.LOADING]: "Creating ERC-20 version",
      [OperationStepStatus.STEP_COMPLETED]: "ERC-20 version created",
      [OperationStepStatus.STEP_FAILED]: "Failed to create ERC-20 version ",
      [OperationStepStatus.OPERATION_COMPLETED]: "ERC-20 version created",
    },
  };

  return createWrapper ? [deployTokenStep, createWrapperStep] : [deployTokenStep];
}

function CreateTokenActionButton({
  handleCreateToken,
  createWrapper,
}: {
  handleCreateToken: () => Promise<void>;
  createWrapper: boolean;
}) {
  const { status, createTokenHash, createWrapperHash } = useCreateTokenStatusStore();

  const hashes = useMemo(() => {
    return createWrapper ? [createTokenHash, createWrapperHash] : [createTokenHash];
  }, [createTokenHash, createWrapper, createWrapperHash]);

  if (status !== CreateTokenStatus.INITIAL) {
    return (
      <OperationRows>
        {composeCreateTokensSteps(createWrapper).map((step, index) => (
          <OperationStepRow
            key={index}
            iconName={step.iconName}
            hash={hashes[index]}
            statusTextMap={step.textMap}
            status={operationStatusToStepStatus({
              currentStatus: status,
              orderedSteps: composeCreateTokensSteps(createWrapper).flatMap((s) => [
                s.pending,
                s.loading,
                s.error,
              ]),
              stepIndex: index,
              pendingStep: step.pending,
              loadingStep: step.loading,
              errorStep: step.error,
              successStep: CreateTokenStatus.SUCCESS,
            })}
            isFirstStep={index === 0}
          />
        ))}
      </OperationRows>
    );
  }

  return (
    <Button onClick={() => handleCreateToken()} fullWidth>
      Confirm token creating
    </Button>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-tertiary-bg rounded-3 flex flex-col gap-1 px-5 py-4 text-14">
      <span className="text-secondary-text">{title}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function ConfirmCreateTokenDialog({
  createTokenSettings,
}: {
  createTokenSettings: {
    name: string;
    symbol: string;
    totalSupply: string;
    imageURL: string;
    allowMintForOwner: boolean;
    createERC20: boolean;
  };
}) {
  const chainId = useCurrentChainId();
  const { isOpen, setIsOpen } = useCreateTokenDialogStore();
  const { status, setStatus } = useCreateTokenStatusStore();
  const { handleCreateToken, setTokenAddress, tokenAddress } = useCreateToken(createTokenSettings);
  const isInitialStatus = useMemo(() => status === CreateTokenStatus.INITIAL, [status]);
  const isFinalStatus = useMemo(
    () => status === CreateTokenStatus.SUCCESS || status === CreateTokenStatus.ERROR_CREATE_TOKEN,
    [status],
  );

  const isLoadingStatus = useMemo(
    () => !isInitialStatus && !isFinalStatus,
    [isFinalStatus, isInitialStatus],
  );

  useEffect(() => {
    if (isFinalStatus && !isOpen) {
      setTimeout(() => {
        setStatus(CreateTokenStatus.INITIAL);
        setTokenAddress(null);
      }, 400);
    }
  }, [isFinalStatus, isOpen, setStatus, setTokenAddress, status]);

  const network = useMemo(() => {
    return networks.find((t) => t.chainId === chainId);
  }, [chainId]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <DialogHeader onClose={() => setIsOpen(false)} title="Create a token" />
      <div className="md:w-[600px] card-spacing-x card-spacing-b">
        {isInitialStatus && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Card title="Name" value={createTokenSettings.name} />
              <Card title="Symbol" value={createTokenSettings.symbol} />
            </div>

            <div className="rounded-3 bg-tertiary-bg px-5 py-3 flex justify-between items-center">
              <span className="text-14 text-secondary-text">Total supply</span>

              <div className="flex items-center gap-1">
                <span>{+createTokenSettings.totalSupply}</span>
                <span className="text-14 text-secondary-text">{createTokenSettings.symbol}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 py-4">
              <SwapDetailsRow
                title="New tokens issuing"
                value={createTokenSettings.allowMintForOwner ? "Allowed" : "Not allowed"}
                tooltipText="Tooltip text"
              />
              <SwapDetailsRow
                title="Make ERC-20 version"
                value={createTokenSettings.createERC20 ? "Yes" : "No"}
                tooltipText="Tooltip text"
              />
            </div>

            <div className="pb-4">
              <Alert
                className="ui-bg-tertiary-bg"
                text={
                  <p className="">
                    You are deploying the token to{" "}
                    <span className="text-primary-text relative inline-block pl-6 ml-0.5">
                      <Image
                        className="absolute -left-0" // Next/Image is block by default
                        width={20}
                        height={20}
                        src={network?.logo || ""}
                        alt=""
                      />
                      {network?.name}
                    </span>{" "}
                    network
                  </p>
                }
                type={"info-border"}
              />
            </div>
          </div>
        )}

        {isLoadingStatus && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Card title="Name" value={createTokenSettings.name} />
              <Card title="Symbol" value={createTokenSettings.symbol} />
            </div>

            <div className="rounded-3 bg-tertiary-bg px-5 py-4 flex justify-between">
              <span className="text-14 text-secondary-text">Total supply</span>

              <div className="flex items-center gap-1">
                <span>{createTokenSettings.totalSupply}</span>
                <span className="text-14 text-secondary-text">{createTokenSettings.symbol}</span>
              </div>
            </div>
            <div className="h-px w-full bg-secondary-border mb-4 mt-5" />
          </div>
        )}

        {isFinalStatus && (
          <div>
            <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
              {status === CreateTokenStatus.ERROR_CREATE_TOKEN && (
                <EmptyStateIcon iconName="warning" />
              )}

              {(status === CreateTokenStatus.SUCCESS ||
                status === CreateTokenStatus.ERROR_CREATE_WRAPPER) && (
                <>
                  <div className="w-[54px] h-[54px] rounded-full border-[7px] blur-[8px] opacity-80 border-green" />
                  <Svg
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green"
                    iconName={"success"}
                    size={65}
                  />
                </>
              )}
            </div>
            {(status === CreateTokenStatus.SUCCESS ||
              status === CreateTokenStatus.ERROR_CREATE_WRAPPER) && (
              <div>
                <h2 className="text-center mb-1 font-bold text-20 ">Token successfully created</h2>
                <p className="text-center">
                  Create a pool and add liquidity so your token can trade, then list it in an
                  auto-listing contract.
                </p>
                {tokenAddress && (
                  <div className="flex justify-center pt-3">
                    <ExternalTextLink
                      text={truncateMiddle(tokenAddress)}
                      href={getExplorerLink(ExplorerLinkType.TOKEN, tokenAddress, chainId)}
                    />
                  </div>
                )}
              </div>
            )}
            {status === CreateTokenStatus.ERROR_CREATE_TOKEN && (
              <div>
                <h2 className="text-center mb-1 font-bold text-20 ">Fail to create a token</h2>
              </div>
            )}
            <div className="h-px w-full bg-secondary-border mb-4 mt-5" />
          </div>
        )}

        <CreateTokenActionButton
          createWrapper={createTokenSettings.createERC20}
          handleCreateToken={handleCreateToken}
        />

        {status === CreateTokenStatus.ERROR_CREATE_WRAPPER && (
          <Alert
            className="mt-4 mb-1"
            type="error"
            text="Your ERC-223 token was successfully deployed, but ERC-20 wrapper creation failed"
          />
        )}

        {(status === CreateTokenStatus.SUCCESS ||
          status === CreateTokenStatus.ERROR_CREATE_WRAPPER) && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link href={tokenAddress ? `/add?tier=3000&tokenA=${tokenAddress}` : "/add?tier=3000"}>
              <Button
                className="border-green disabled:bg-green-bg disabled:opacity-50"
                colorScheme={ButtonColor.LIGHT_GREEN}
                fullWidth
              >
                Create pool
              </Button>
            </Link>
            <Link
              href={
                tokenAddress ? `/token-listing/add?tokenA=${tokenAddress}` : "/token-listing/add"
              }
            >
              <Button
                className="border-green disabled:bg-green-bg disabled:opacity-50"
                colorScheme={ButtonColor.LIGHT_GREEN}
                fullWidth
              >
                List token
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DrawerDialog>
  );
}
