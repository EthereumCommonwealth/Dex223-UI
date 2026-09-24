import { createContext, useContext } from "react";

// Dialog and Drawer point aria-labelledby / aria-describedby at these ids; DialogHeader puts
// them on its title and paragraph so assistive tech announces the dialog by its title.
export const DialogLabelContext = createContext<{ headingId?: string; descriptionId?: string }>({});

export function useDialogLabelIds() {
  return useContext(DialogLabelContext);
}
