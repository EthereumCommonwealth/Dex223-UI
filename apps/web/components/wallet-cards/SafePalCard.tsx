import { useTranslations } from "next-intl";
import { useAccount, useConnect } from "wagmi";

import PickButton from "@/components/buttons/PickButton";
import {
  useConnectWalletDialogStateStore,
  useConnectWalletStore,
} from "@/components/dialogs/stores/useConnectWalletStore";
import { rdnsMap } from "@/config/connectors/rdns";
import { wallets } from "@/config/wallets";
import usePreloaderTimeout from "@/hooks/usePreloader";
import addToast from "@/other/toast";

const { image, name } = wallets.safePal;
export default function SafePalCard() {
  const t = useTranslations("Wallet");
  const { connectors, connectAsync, isPending } = useConnect();
  const { isConnecting } = useAccount();
  const { setName, chainToConnect } = useConnectWalletStore();
  const { setIsOpened } = useConnectWalletDialogStateStore();

  const loading = usePreloaderTimeout({ isLoading: isPending });

  console.log(connectors);
  return (
    <PickButton
      disabled={isConnecting}
      onClick={() => {
        setName("coinbase");
        const connectorToConnect = connectors[4];

        if (!connectorToConnect) {
          return addToast(t("install_coinbase"), "error");
        }

        connectAsync({
          connector: connectorToConnect,
          chainId: chainToConnect,
        })
          .then(() => {
            setIsOpened(false);
            addToast(t("successfully_connected"));
          })
          .catch((e) => {
            if (e.code && e.code === 4001) {
              addToast(t("user_rejected"), "error");
            } else {
              console.log(e);
              addToast(t("something_went_wrong"), "error");
            }
          });
      }}
      image={image}
      label={name}
      loading={loading}
    />
  );
}
