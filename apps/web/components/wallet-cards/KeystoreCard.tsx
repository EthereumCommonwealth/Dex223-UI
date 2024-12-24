import { useState } from "react";
import { useAccount } from "wagmi";

import PickButton from "@/components/buttons/PickButton";
import KeystoreConnectDialog from "@/components/dialogs/KeystoreConnectDialog";
import { wallets } from "@/config/wallets";

const { image, name } = wallets.keystore;
export default function KeystoreCard() {
  const [isOpenKeystore, setIsOpenKeystore] = useState(false);

  const { isConnecting } = useAccount();

  return (
    <>
      <PickButton
        disabled={isConnecting}
        onClick={() => setIsOpenKeystore(true)}
        image={image}
        label={name}
        loading={isOpenKeystore}
      />

      <KeystoreConnectDialog isOpen={isOpenKeystore} setIsOpen={setIsOpenKeystore} />
    </>
  );
}
