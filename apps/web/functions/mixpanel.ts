import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { watchAccount } from "wagmi/actions";

import { config } from "@/config/wagmi/config";
import { usePathname } from "@/i18n/routing";

enum MIXPANEL_EVENTS {
  "connectWallet" = "connectWallet",
  "error" = "error",
}

type MixpanelEventType = keyof typeof MIXPANEL_EVENTS;

export const trackEvent = (event_name: MixpanelEventType, props?: any) => {
  try {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(event_name, props);
    }
  } catch (e) {
    console.log(e);
  }
};

export const trackPageview = (props?: any) => {
  try {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track_pageview(props);
    }
  } catch (e) {
    console.log(e);
  }
};

export const mixpanelIdentify = (id: string | number) => {
  try {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.identify(id);
    }
  } catch (e) {
    console.log(e);
  }
};

export const mixpanelSetProfileProp = (name: string, value: any) => {
  try {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.people.set({ [name]: value });
    }
  } catch (e) {
    console.log(e);
  }
};

export const MixpanelNavigationEvents = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = useRef("");

  useEffect(() => {
    const url = `${pathname}?${searchParams}`;
    if (currentUrl.current !== url) {
      currentUrl.current = url;
      // Mixpanel rounting events
      // Send track event when new pages is loaded
      trackPageview();
    }
  }, [pathname, searchParams]);

  return null;
};

export const useMixpanelConnectWalletEvents = () => {
  // Track wallect connect
  useEffect(() => {
    const unwatch = watchAccount(config, {
      onChange(data) {
        if (data.address && data.isConnected) {
          trackEvent("connectWallet", { address: data.address });
          mixpanelIdentify(data.address);
          mixpanelSetProfileProp("$name", data.address);
          mixpanelSetProfileProp("address", data.address);
          if (data.connector?.id) {
            mixpanelSetProfileProp("connectorId", data.connector.id);
            mixpanelSetProfileProp("connectorName", data.connector.name);
          }
        }
      },
    });
    return () => unwatch();
  }, []);
};
