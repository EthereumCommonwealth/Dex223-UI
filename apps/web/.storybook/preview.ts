import type { Preview } from "@storybook/react";
import "../assets/styles/tw.css";
import "@repo/ui/styles.css";

import nextIntl from "./next-intl";

const preview: Preview = {
  initialGlobals: {
    locale: "en",
    locales: {
      en: "English",
      es: "Spanish",
      zh: "Chinese",
    },
  },
  parameters: {
    nextIntl,
    options: {
      storySort: {
        order: ["Atoms", "Buttons", "Molecules"],
      },
    },
    backgrounds: {
      default: "dark",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
