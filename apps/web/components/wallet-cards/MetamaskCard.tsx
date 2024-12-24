import { useTranslations } from "next-intl";
import { isMobile } from "react-device-detect";
import { useAccount, useConnect, useReconnect, useSwitchChain } from "wagmi";

import PickButton from "@/components/buttons/PickButton";
import {
  useConnectWalletDialogStateStore,
  useConnectWalletStore,
} from "@/components/dialogs/stores/useConnectWalletStore";
import { wallets } from "@/config/wallets";
import useDetectMetaMaskMobile from "@/hooks/useMetamaskMobile";
import usePreloaderTimeout from "@/hooks/usePreloader";
import { usePathname } from "@/i18n/routing";
import addToast from "@/other/toast";

const { image, name } = wallets.metamask;
export default function MetamaskCard() {
  const t = useTranslations("Wallet");
  const { connectors, connectAsync, isPending } = useConnect();
  const { isConnecting } = useAccount();
  const { setName, chainToConnect } = useConnectWalletStore();
  const { setIsOpened } = useConnectWalletDialogStateStore();
  const isMetamaskMobile = useDetectMetaMaskMobile();

  const { switchChainAsync } = useSwitchChain();

  const loading = usePreloaderTimeout({ isLoading: isPending });

  const pathname = usePathname();

  console.log(pathname);

  if (isMobile && !isMetamaskMobile) {
    return (
      <a href={`https://metamask.app.link/dapp/${window.location.host || "test-app.dex223.io"}`}>
        <PickButton disabled={isConnecting} image={image} label={name} loading={loading} />
      </a>
    );
  }

  return (
    <PickButton
      disabled={isConnecting}
      onClick={async () => {
        setName("metamask");
        console.log(connectors[2]);
        const connectorToConnect = connectors[2];

        console.log(connectorToConnect);
        if (!connectorToConnect) {
          return addToast(t("install_metamask"), "error");
        }

        try {
          await connectAsync({
            connector: connectorToConnect,
          });
          await switchChainAsync({ chainId: chainToConnect });
          setIsOpened(false);
          addToast(t("successfully_connected"));
        } catch (e: any) {
          // console.log(e);
          if (e.code && e.code === 4001) {
            addToast(t("user_rejected"), "error");
          } else {
            addToast(t("something_went_wrong"), "error");
          }
        }
      }}
      image={image}
      label={name}
      loading={loading}
    />
  );
}
