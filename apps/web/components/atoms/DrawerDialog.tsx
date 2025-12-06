import React, { PropsWithChildren } from "react";
import { useMediaQuery } from "react-responsive";
import { useSwipeable } from "react-swipeable";

import Dialog from "@/components/atoms/Dialog";
import Drawer from "@/components/atoms/Drawer";

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  maxMobileWidth?: string;
}
export default function DrawerDialog({ isOpen, children, setIsOpen, maxMobileWidth = '640px' }: PropsWithChildren<Props>) {
  const isMobile = useMediaQuery({ query: `(max-width: ${maxMobileWidth})` });

  const handlers = useSwipeable({
    onSwipedDown: (eventData) => {
      setIsOpen(false);
    },
    delta: { down: 200 },
  });

  return (
    <>
      {isMobile ? (
        <Drawer isOpen={isOpen} setIsOpen={setIsOpen}>
          {children}
        </Drawer>
      ) : (
        <Dialog isOpen={isOpen} setIsOpen={setIsOpen}>
          {children}
        </Dialog>
      )}
    </>
  );
}
