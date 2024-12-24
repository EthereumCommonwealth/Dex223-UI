"use client";
import { PropsWithChildren } from "react";

import FeedbackDialog from "@/components/dialogs/FeedbackDialog";

export default function DialogsProvider({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <FeedbackDialog />
    </>
  );
}
