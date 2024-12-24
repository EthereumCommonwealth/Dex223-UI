import Image from "next/image";
import { useCallback, useState } from "react";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import { TokenPortfolioDialogContent } from "@/components/dialogs/TokenPortfolioDialog";
import ImportList from "@/components/manage-tokens/ImportList";
import ImportToken from "@/components/manage-tokens/ImportToken";
import TokensAndLists from "@/components/manage-tokens/TokensAndLists";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { Token } from "@/sdk_hybrid/entities/token";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

export default function ManageTokensDialog() {
  const { isOpen, setIsOpen, content, setContent } = useManageTokensDialogStore();

  const [tokenForPortfolio, setTokenForPortfolio] = useState<Token | null>(null);
  const { setActiveTab } = useManageTokensDialogStore();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setContent("default");
      setActiveTab(0);
      setTokenForPortfolio(null);
    }, 400);
  }, [setIsOpen, setContent, setActiveTab]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={handleClose}>
      <div className="z-[1000]">
        {content === "default" && (
          <TokensAndLists
            setTokenForPortfolio={(token: Token) => {
              setTokenForPortfolio(token);
              setContent("token-portfolio");
            }}
            setContent={setContent}
            handleClose={handleClose}
          />
        )}
        {content === "import-token" && (
          <ImportToken setContent={setContent} handleClose={handleClose} />
        )}
        {content === "import-list" && (
          <ImportList setContent={setContent} handleClose={handleClose} />
        )}
        {content === "token-portfolio" && tokenForPortfolio && (
          <>
            <DialogHeader
              onClose={handleClose}
              onBack={() => {
                setContent("default");
                setTokenForPortfolio(null);
              }}
              title={
                <span className="flex items-center gap-2">
                  <Image
                    width={32}
                    height={32}
                    src={tokenForPortfolio?.logoURI || "/images/tokens/placeholder.svg"}
                    alt=""
                  />
                  {tokenForPortfolio?.name || "Unknown"}
                </span>
              }
            />
            <TokenPortfolioDialogContent token={tokenForPortfolio} />
          </>
        )}
      </div>
    </DrawerDialog>
  );
}
