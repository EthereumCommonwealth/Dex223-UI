import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { usePortfolioActiveTabStore } from "@/app/[locale]/portfolio/stores/usePortfolioStore";
import { ActiveTab } from "@/app/[locale]/portfolio/stores/usePortfolioStore";
import { usePathname } from "@/i18n/routing";

enum PoolsQueryParams {
  tab = "tab",
}

export const usePortfolioSearchParams = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const locale = useLocale();
  const _pathname = usePathname();
  const pathname = `/${locale}${_pathname}`;
  const searchParams = useSearchParams();

  const { activeTab, setActiveTab } = usePortfolioActiveTabStore();
  const currentPath = useMemo(() => {
    return searchParams.toString() ? pathname + "?" + searchParams.toString() : pathname;
  }, [searchParams, pathname]);

  const updatedPath = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(PoolsQueryParams.tab, activeTab.toString());

    return pathname + "?" + params.toString();
  }, [pathname, searchParams, activeTab]);

  useEffect(() => {
    if (!isInitialized) {
      const tab = searchParams.get(PoolsQueryParams.tab);
      if (
        tab &&
        Object.values(ActiveTab)
          .map((tab) => tab.toString())
          .includes(tab)
      ) {
        setActiveTab(tab as any);
      }
      setIsInitialized(true);
    }
  }, [searchParams, setActiveTab, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      if (currentPath !== updatedPath) {
        window.history.pushState(null, "", updatedPath);
      }
    }
  }, [currentPath, updatedPath, isInitialized]);
};
