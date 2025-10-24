import Preloader from "@repo/ui/preloader";
import { Formik } from "formik";
import { useTranslations } from "next-intl";
import { ChangeEvent, useRef, useState } from "react";
import { useConnect } from "wagmi";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import TextField from "@/components/atoms/TextField";
import Button, { ButtonColor } from "@/components/buttons/Button";
import {
  useConnectWalletDialogStateStore,
  useConnectWalletStore,
} from "@/components/dialogs/stores/useConnectWalletStore";
import { keystore } from "@/config/connectors/keystore/connector";
import { unlockKeystore } from "@/functions/keystore";

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function KeystoreConnectDialog({ isOpen, setIsOpen }: Props) {
  const t = useTranslations("Wallet");
  const { setIsOpened: setConnectWalletDialogOpened } = useConnectWalletDialogStateStore();

  const fileInput = useRef<HTMLInputElement | null>(null);
  const { chainToConnect } = useConnectWalletStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [keystoreFile, setKeystore] = useState<{ [key: string]: string } | null>(null);
  const [isUnlockingKeystore, setIsUnlockingKeystore] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFileError(undefined);
    const file = event?.target?.files?.[0];

    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (e.target) {
            const fileContents: any = e.target.result;
            const parsedJson = JSON.parse(fileContents);
            setKeystore(parsedJson);
          }
        } catch (e) {
          setFileError(t("unsupported_file_format"));
        }
      };
      reader.readAsText(file);
    } else {
      setKeystore(null);
    }
  };

  const { connect } = useConnect();

  const importKeystoreFileHandler = async () => {
    setIsUnlockingKeystore(true);
    try {
      const result = await unlockKeystore(keystoreFile, password);
      const PK: any = result?.getPrivateKeyString && result?.getPrivateKeyString();

      if (PK) {
        const connector = keystore({ pk: PK });
        connect({ chainId: chainToConnect, connector });

        setIsOpen(false);
        setConnectWalletDialogOpened(false);
      } else {
        setError(t("wrong_password"));
      }
    } catch (error) {
      console.log("importKeystoreFileHandler ~ error:", error);
      setError(t("wrong_password"));
    } finally {
      setIsUnlockingKeystore(false);
    }
  };

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="min-w-[440px]">
        <DialogHeader onClose={() => setIsOpen(false)} title={t("import_wallet_with_JSON")} />

        <div className="card-spacing-x card-spacing-b">
          <Formik
            initialValues={{ name: "jared" }}
            onSubmit={(values, actions) => {
              importKeystoreFileHandler();
            }}
          >
            {(props) => (
              <form onSubmit={props.handleSubmit}>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e)}
                  style={{ display: "none" }}
                  ref={fileInput}
                />
                <div className="flex items-center justify-between rounded-3 bg-tertiary-bg p-5">
                  <div className="w-[120px]">
                    <Button
                      type="button"
                      onClick={() => {
                        if (fileInput.current && fileInput.current) {
                          fileInput.current.click();
                        }
                      }}
                      colorScheme={ButtonColor.LIGHT_GREEN}
                    >
                      {t("browse")}
                    </Button>
                  </div>
                  <p className="overflow-hidden overflow-ellipsis whitespace-nowrap w-[200px] text-right">
                    {selectedFile?.name ? (
                      <span className="flex items-center gap-1">
                        <Svg className="text-tertiary-text flex-shrink-0" iconName="file" />
                        <span className="overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[172px] text-right">
                          {selectedFile?.name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-secondary-text">{t("select_keystore_file")}</span>
                    )}
                  </p>
                </div>
                <div className="text-red-light text-12 mb-4 mt-0.5 h-4">
                  {fileError && fileError}
                </div>
                <div>
                  <TextField
                    disabled={!selectedFile || Boolean(fileError)}
                    label={t("keystore_password")}
                    value={password}
                    type="password"
                    required
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder={t("keystore_password")}
                    error={error || undefined}
                    helperText={""}
                  />
                  <div className="mt-6">
                    <Button type="submit" disabled={!selectedFile || Boolean(fileError)} fullWidth>
                      {!isUnlockingKeystore ? t("unlock") : <Preloader size={30} type="awaiting" />}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Formik>
        </div>
      </div>
    </DrawerDialog>
  );
}
