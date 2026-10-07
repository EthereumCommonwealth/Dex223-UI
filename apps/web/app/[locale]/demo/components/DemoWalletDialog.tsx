"use client";

import { useTranslations } from "next-intl";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { useRouter } from "@/i18n/routing";
import { useDemoWalletDialogStore } from "@/stores/useDemoWalletDialogStore";

export default function DemoWalletDialog() {
  const t = useTranslations("Demo");
  const router = useRouter();
  const { isOpen, setIsOpen } = useDemoWalletDialogStore();

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="w-full md:w-[480px]">
        <DialogHeader onClose={() => setIsOpen(false)} title={t("wallet_dialog_title")} />
        <div className="px-4 pb-4 md:px-10 md:pb-10 flex flex-col gap-5">
          <p className="text-secondary-text">{t("wallet_dialog_text")}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size={ButtonSize.MEDIUM}
              colorScheme={ButtonColor.LIGHT_GREEN}
              onClick={() => setIsOpen(false)}
            >
              {t("wallet_dialog_stay")}
            </Button>
            <Button
              size={ButtonSize.MEDIUM}
              onClick={() => {
                setIsOpen(false);
                router.push("/swap");
              }}
            >
              {t("wallet_dialog_exit")}
            </Button>
          </div>
        </div>
      </div>
    </DrawerDialog>
  );
}
