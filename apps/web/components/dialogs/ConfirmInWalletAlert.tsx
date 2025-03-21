import Preloader from "@repo/ui/preloader";

import Container from "@/components/atoms/Container";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import { useConfirmInWalletAlertStore } from "@/stores/useConfirmInWalletAlertStore";

export default function ConfirmInWalletAlert() {
  const { isOpened, description, closeConfirmInWalletAlert } = useConfirmInWalletAlertStore();

  return (
    <>
      {isOpened && (
        <div className="z-[1000] fixed w-full bg-green-bg border-green border-t shadow-notification bottom-0">
          <Container>
            <div className="h-12 md:h-[80px] flex justify-between md:text-16 text-14 items-center pl-4 pr-1 md:px-5">
              <div className="flex gap-3 items-center">
                <Preloader type="linear" />
                <span>{description}</span>
              </div>
              <IconButton
                variant={IconButtonVariant.CLOSE}
                handleClose={closeConfirmInWalletAlert}
              />
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
