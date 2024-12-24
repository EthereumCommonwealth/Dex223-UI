import clsx from "clsx";
import { useTranslations } from "next-intl";
import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";

import Alert from "@/components/atoms/Alert";
import Checkbox from "@/components/atoms/Checkbox";
import Svg from "@/components/atoms/Svg";
import { HelperText } from "@/components/atoms/TextField";
import Button, { ButtonColor, ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { db, TokenList } from "@/db/db";
import addToast from "@/other/toast";

interface Props {
  setContent: (content: ManageTokensDialogContent) => void;
}
export default function ImportListWithJSON({ setContent }: Props) {
  const t = useTranslations("ManageTokens");

  const [tokenListFile, setTokenListFile] = useState<File | undefined>();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];

    if (file) {
      setTokenListFile(file);
      if (file.size > 2097152) {
        setError("File is larger then 2MB");
      } else {
        setError("");
      }
    } else {
      setTokenListFile(undefined);
    }
  };

  const [tokenListFileContent, setTokenListFileContent] = useState<TokenList | undefined>();

  useEffect(() => {
    if (tokenListFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (e.target) {
            const fileContents: any = e.target.result;
            const parsedJson = JSON.parse(fileContents);
            //TODO: Check that all tokens in list from same chain

            if (!parsedJson.tokens || !parsedJson.tokens || !parsedJson.version) {
              setError("Unsupported tokenlist format");
              return;
            } else {
              setError("");
            }

            console.log(parsedJson);
            const listChainId = parsedJson.tokens[0].chainId;
            console.log(listChainId);

            console.log();
            if (listChainId) {
              setTokenListFileContent({
                enabled: true,
                list: parsedJson,
                chainId: listChainId,
              });
            }
          }
        } catch (e) {
          console.log(e);
        }
      };
      reader.readAsText(tokenListFile);
    }
  }, [tokenListFile]);

  const handleJSONImport = useCallback(() => {
    if (tokenListFileContent) {
      db.tokenLists.add(tokenListFileContent);
    }
  }, [tokenListFileContent]);

  const fileInput = useRef<HTMLInputElement | null>(null);

  const [checkedUnderstand, setCheckedUnderstand] = useState<boolean>(false);

  const [dragEntered, setDragEntered] = useState(false);

  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragEntered(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragEntered(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log(event.dataTransfer.files);

    setTokenListFile(event.dataTransfer.files[0]);
    if (event.dataTransfer.files[0].size > 2097152) {
      setError("File is larger then 2MB");
    } else {
      setError("");
    }
    setDragEntered(false);
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const [error, setError] = useState<string>("");

  return (
    <div className="flex flex-col flex-grow">
      <input
        type="file"
        onChange={(e) => handleFileChange(e)}
        style={{ display: "none" }}
        ref={fileInput}
        accept=".json"
      />
      <div className="flex items-center justify-between">
        <div>
          <Button
            size={ButtonSize.MEDIUM}
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
        <p className="overflow-hidden overflow-ellipsis whitespace-nowrap min-w-[200px] max-w-[300px] text-right">
          {tokenListFile?.name ? (
            <span className="flex items-center gap-1">
              <Svg className="text-tertiary-text" iconName="file" />
              {tokenListFile?.name}
            </span>
          ) : (
            <span className="text-tertiary-text">{t("select_json_file")}</span>
          )}
        </p>
      </div>
      {(!tokenListFileContent || Boolean(error)) && (
        <>
          <h3 className="text-16 font-bold mt-5 mb-1 text-secondary-text">
            {t("please_select_JSON_to_import")}
          </h3>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onClick={() => {
              if (fileInput.current && fileInput.current) {
                fileInput.current.click();
              }
            }}
            className={clsx(
              "rounded-2  flex justify-center items-center flex-col gap-3 bg-drag-and-drop-dashed-pattern flex-grow duration-200 t text-20  cursor-pointer text-tertiary-text",
              !dragEntered ? "bg-secondary-bg" : !error ? "bg-green-bg" : "bg-red-bg",
              !!error
                ? "shadow shadow-red/20 bg-drag-and-drop-dashed-pattern-error hocus:bg-red-bg"
                : "hocus:bg-green-bg",
            )}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5C13.625 5 12.4479 5.48958 11.4688 6.46875C10.4896 7.44792 10 8.625 10 10V50C10 51.375 10.4896 52.5521 11.4688 53.5312C12.4479 54.5104 13.625 55 15 55H32.9375C33.6042 55 34.2396 54.875 34.8438 54.625C35.4479 54.375 35.9792 54.0208 36.4375 53.5625L48.5625 41.4375C49.0208 40.9792 49.375 40.4479 49.625 39.8438C49.875 39.2396 50 38.6042 50 37.9375V10C50 8.625 49.5104 7.44792 48.5312 6.46875C47.5521 5.48958 46.375 5 45 5H15ZM32.5 40C32.5 39.2917 32.7396 38.6979 33.2188 38.2188C33.6979 37.7396 34.2917 37.5 35 37.5H45L32.5 50V40Z"
                fill={!tokenListFile ? "#798180" : "#D1DEDF"}
              />
            </svg>

            {tokenListFile ? (
              <span className="text-primary-text">{tokenListFile.name}</span>
            ) : (
              t("import_files_or_drag_and_drop")
            )}
          </div>
          <HelperText helperText={"Max 2MB, file type JSON"} error={error ? error : undefined} />
        </>
      )}
      {tokenListFileContent && !error && (
        <>
          <div className="flex-grow">
            <div className="flex items-center gap-3 py-2.5 mt-3 mb-3">
              <img
                className="w-12 h-12"
                width={48}
                height={48}
                src={tokenListFileContent.list.logoURI || "/images/tokenlist-placeholder.svg"}
                alt=""
              />
              <div className="flex flex-col text-16">
                <span className="text-primary-text">{tokenListFileContent.list.name}</span>
                <span className="text-secondary-text">
                  {t("tokens_amount", { amount: tokenListFileContent.list.tokens.length })}
                </span>
              </div>
            </div>
            <Alert text={t("adding_list_warning")} type="warning" />
          </div>

          <div className="flex flex-col gap-5">
            <Checkbox
              checked={checkedUnderstand}
              handleChange={() => setCheckedUnderstand(!checkedUnderstand)}
              id="approve-list-import"
              label={t("i_understand")}
              labelClassName="text-secondary-text"
            />
            <Button
              fullWidth
              disabled={!checkedUnderstand || Boolean(error)}
              size={ButtonSize.LARGE}
              onClick={() => {
                handleJSONImport();
                setContent("default");
                addToast(t("list_imported"));
              }}
            >
              {t("import_with_JSON")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
