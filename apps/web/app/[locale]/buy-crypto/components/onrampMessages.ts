/** Origins the Onramp widget is served from (the SDK's production and sandbox domains). */
export const ONRAMP_WIDGET_ORIGINS = ["https://onramp.money", "https://test.onramp.money"];

type OnrampSdkInternals = {
  _appURL?: string;
  _widgetMessageHandler?: (event: MessageEvent) => void;
};

/**
 * Make the Onramp SDK accept widget messages only from the widget's own origin.
 *
 * The SDK (1.7.0) treats any window message whose data carries `eventData.isOnramp` as a widget
 * event and never checks `event.origin`, so any page holding a reference to this window (an
 * opener, for example) could post a forged "transaction completed". The SDK registers
 * `_widgetMessageHandler` when `show()` runs, so wrapping it before `show()` puts the origin check
 * in front of every widget event; `close()` removes the same wrapped handler.
 *
 * Returns false when the SDK no longer has that handler, so the caller can stop trusting events.
 */
export function guardOnrampWidgetMessages(instance: unknown): boolean {
  const sdk = instance as OnrampSdkInternals;
  const handler = sdk._widgetMessageHandler;
  if (typeof handler !== "function") return false;

  let origin: string | null = null;
  try {
    origin = sdk._appURL ? new URL(sdk._appURL).origin : null;
  } catch {
    origin = null;
  }
  const allowed =
    origin && ONRAMP_WIDGET_ORIGINS.includes(origin) ? [origin] : ONRAMP_WIDGET_ORIGINS;

  sdk._widgetMessageHandler = (event: MessageEvent) => {
    if (allowed.includes(event.origin)) handler(event);
  };
  return true;
}
