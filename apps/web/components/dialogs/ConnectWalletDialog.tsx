import { useTranslations } from "next-intl";
import { isMobile } from "react-device-detect";
// import { browserName, CustomView } from "react-device-detect";
import { useSwitchChain } from "wagmi";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import PickButton from "@/components/buttons/PickButton";
import {
  useConnectWalletDialogStateStore,
  useConnectWalletStore,
} from "@/components/dialogs/stores/useConnectWalletStore";
import CoinbaseCard from "@/components/wallet-cards/CoinbaseCard";
import KeystoreCard from "@/components/wallet-cards/KeystoreCard";
import MetamaskCard from "@/components/wallet-cards/MetamaskCard";
import TrustWalletCard from "@/components/wallet-cards/TrustWalletCard";
import WalletConnectCard from "@/components/wallet-cards/WalletConnectCard";
import { networks } from "@/config/networks";
import useDetectMetaMaskMobile from "@/hooks/useMetamaskMobile";

function StepLabel({ step, label }: { step: string; label: string }) {
  return (
    <div className="flex gap-3 items-center">
      <span className="w-10 h-10 text-18 rounded-full bg-tertiary-bg flex items-center justify-center">
        {step}
      </span>
      <span className="text-18 text-secondary-text font-medium">{label}</span>
    </div>
  );
}

export default function ConnectWalletDialog() {
  const t = useTranslations("Wallet");

  const { isOpened: isOpenedWallet, setIsOpened: setOpenedWallet } =
    useConnectWalletDialogStateStore();

  const { chainToConnect, setChainToConnect } = useConnectWalletStore();
  const { switchChain } = useSwitchChain();

  return (
    <DrawerDialog isOpen={isOpenedWallet} setIsOpen={setOpenedWallet}>
      <div className="w-full md:w-[600px]">
        <DialogHeader onClose={() => setOpenedWallet(false)} title={t("connect_wallet")} />
        <div className="card-spacing">
          <StepLabel step="1" label={t("choose_network")} />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3 mb-5">
            {networks.map(({ name, chainId, logo }) => {
              return (
                <PickButton
                  key={chainId}
                  isActive={chainId === chainToConnect}
                  onClick={() => {
                    setChainToConnect(chainId);
                    if (switchChain) {
                      switchChain({ chainId });
                    }
                  }}
                  image={logo}
                  label={name}
                />
              );
            })}
          </div>
          <StepLabel step="2" label={t("choose_wallet")} />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
            <MetamaskCard />
            <WalletConnectCard />
            <CoinbaseCard />
            {!isMobile && <TrustWalletCard />}
            <KeystoreCard />
          </div>
        </div>
      </div>
    </DrawerDialog>
  );
}
