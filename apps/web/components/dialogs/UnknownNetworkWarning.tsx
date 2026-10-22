import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useSwitchChain } from "wagmi";

import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import { useUnknownNetworkWarningStore } from "@/components/dialogs/stores/useUnknownNetworkWarningStore";
import { DexChainId } from "@/sdk_bi/chains";

export default function UnknownNetworkWarning() {
  const t = useTranslations("ManageTokens");
  const { isOpened, title, closeNoTokenListsEnabledWarning, openNoTokenListsEnabledWarning } =
    useUnknownNetworkWarningStore();
  const { switchChain } = useSwitchChain();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [clearance, setClearance] = useState(0);
  useEffect(() => {
    if (!isOpened || !bannerRef.current) return;
    const measure = () =>
      setClearance((bannerRef.current?.offsetHeight ?? 0) + (window.innerWidth < 768 ? 48 : 0));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bannerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isOpened]);

  return (
    <>
      {isOpened && <div aria-hidden="true" style={{ height: clearance }} />}
      {isOpened && (
        <div
          ref={bannerRef}
          className="z-[1000] fixed w-full bg-orange-bg border-orange border-t shadow-notification shadow-orange-hover/30 bottom-12 md:bottom-0"
        >
          <Container gutter={false}>
            <div className="min-h-[80px] py-4 flex flex-col md:flex-row justify-between md:items-center items-start px-5">
              <div className="flex gap-3 items-center text-14 text-secondary-text md:text-16">
                <Svg className="text-orange flex-shrink-0" iconName="reset" />
                {title}
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto pl-8 md:pl-0 pt-1.5 md:pt-0">
                <Button
                  onClick={() => switchChain({ chainId: DexChainId.MAINNET })}
                  size={ButtonSize.SMALL}
                  className="rounded-2 md:rounded-2 xl:rounded-2 w-full md:w-auto"
                >
                  Change network
                </Button>
              </div>
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
