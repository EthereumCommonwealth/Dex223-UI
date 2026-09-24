import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  useTransitionStyles,
} from "@floating-ui/react";
import { PropsWithChildren, useId } from "react";

import { DialogLabelContext } from "@/components/atoms/DialogLabelContext";

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}
export default function Dialog({ isOpen, setIsOpen, children }: PropsWithChildren<Props>) {
  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: {
      open: 200,
      close: 200,
    },
  });

  // The panel rises slightly while the overlay fades, so the dialog feels placed rather than switched on.
  const { styles: panelTransitionStyles } = useTransitionStyles(context, {
    duration: {
      open: 240,
      close: 160,
    },
    initial: {
      opacity: 0,
      transform: "translateY(8px) scale(0.98)",
    },
    common: {
      transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    },
  });

  const click = useClick(context);
  const role = useRole(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown",
    outsidePress: (event: MouseEvent) => {
      if (!event.target) {
        return true;
      }

      return (event.target as HTMLDivElement).classList.contains("Dialog-overlay");
    },
  });

  const { getFloatingProps } = useInteractions([click, role, dismiss]);

  const headingId = useId();
  const descriptionId = useId();

  return (
    <>
      <FloatingPortal>
        {isMounted && (
          <FloatingOverlay className="Dialog-overlay" style={{ ...transitionStyles }} lockScroll>
            <FloatingFocusManager context={context}>
              <div
                className="surface surface-modal rounded-5"
                style={panelTransitionStyles}
                ref={refs.setFloating}
                aria-labelledby={headingId}
                aria-describedby={descriptionId}
                {...getFloatingProps()}
              >
                <DialogLabelContext.Provider value={{ headingId, descriptionId }}>
                  {children}
                </DialogLabelContext.Provider>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </>
  );
}
