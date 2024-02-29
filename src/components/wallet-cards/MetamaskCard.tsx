import PickButton from "@/components/atoms/PickButton";
import { wallets } from "@/config/wallets";
import { useConnect } from "wagmi";
import usePreloaderTimeout from "@/hooks/usePreloader";
import {
  useConnectWalletDialogStateStore,
  useConnectWalletStore
} from "@/components/dialogs/stores/useConnectWalletStore";
import addToast from "@/other/toast";
import { rdnsMap } from "@/config/connectors/rdns";

const { image, name } = wallets.metamask;
export default function MetamaskCard() {
  const { connectors, connectAsync, isPending } = useConnect();

  const { setName, chainToConnect } = useConnectWalletStore();
  const {setIsOpened} = useConnectWalletDialogStateStore()

  const loading = usePreloaderTimeout({isLoading: isPending});

  return <PickButton onClick={() => {
    setName('metamask');
    const connectorToConnect = connectors.find(c => c.id === rdnsMap.metamask);

    if(!connectorToConnect) {
      return addToast("Please, install Metamask extension to proceed", "error");
    }

    connectAsync({
      connector: connectorToConnect,
      chainId: chainToConnect
    }).then(() => {
      setIsOpened(false);
      addToast("Successfully connected!")
    }).catch((e) => {
      if(e.code && e.code === 4001) {
        addToast("User rejected the request", "error");
      } else {
        addToast("Error: something went wrong", "error");
      }
    });
  }} image={image} label={name} loading={loading} />
}
