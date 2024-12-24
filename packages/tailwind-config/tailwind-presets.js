const plugin = require("tailwindcss/plugin");

const emptyImagePath = "/images/empty-large";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "../../apps/web/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../apps/web/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../apps/blog/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../apps/blog/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      width: {
        "2/3-custom": "72%",
        "1/3-custom": "28%",
        "7/8": "88%",
        "1/8": "12%",
      },
      backgroundSize: {
        "size-180": "180px 180px",
      },
      screens: {
        xs: "520px",
      },
      boxShadow: {
        DEFAULT: "0px 0px 8px 0px var(--tw-shadow-color)",
        notification: "0px -8px 24px 0px var(--tw-shadow-color)",
        icon: "0px 0px 24px 0px var(--tw-shadow-color)",
        popover: "0 4px 42px 0px var(--tw-shadow-color)",
      },
      backgroundImage: {
        "empty-article": `url('${emptyImagePath}/article.svg')`,
        "empty-article-not-found": `url('${emptyImagePath}/article-not-found.svg')`,
        "empty-autolisting-not-found": `url('${emptyImagePath}/autolisting-not-found.svg')`,
        "empty-custom-token": `url('${emptyImagePath}/custom-token.svg')`,
        "empty-deposited-tokens": `url('${emptyImagePath}/deposited-tokens.svg')`,
        "empty-guideline-not-found": `url('${emptyImagePath}/guideline-not-found.svg')`,
        "empty-import-token": `url('${emptyImagePath}/import-token.svg')`,
        "empty-list": `url('${emptyImagePath}/list.svg')`,
        "empty-listing-payment-method-not-found": `url('${emptyImagePath}/listing-payment-method-not-found.svg')`,
        "empty-no-borrow-found": `url('${emptyImagePath}/no-borrow-found.svg')`,
        "empty-no-borrow-orders-yet": `url('${emptyImagePath}/no-borrow-orders-yet.svg')`,
        "empty-no-lendings-orders-yet": `url('${emptyImagePath}/no-lendings-orders-yet.svg')`,
        "empty-no-listed-tokens": `url('${emptyImagePath}/no-listed-tokens.svg')`,
        "empty-no-margin-positions": `url('${emptyImagePath}/no-margin-positions.svg')`,
        "empty-no-positions": `url('${emptyImagePath}/no-positions.svg')`,
        "empty-no-tokens": `url('${emptyImagePath}/no-tokens.svg')`,
        "empty-no-transactions": `url('${emptyImagePath}/no-transactions.svg')`,
        "empty-not-found-lending-order": `url('${emptyImagePath}/not-found-lending-order.svg')`,
        "empty-not-found-lending-position": `url('${emptyImagePath}/not-found-lending-position.svg')`,
        "empty-not-found-margin-position": `url('${emptyImagePath}/not-found-margin-position.svg')`,
        "empty-not-found-pools": `url('${emptyImagePath}/not-found-pools.svg')`,
        "empty-not-found-token": `url('${emptyImagePath}/not-found-token.svg')`,
        "empty-not-found-list": `url('${emptyImagePath}/not-found-list.svg')`,
        "empty-not-found-wallet": `url('${emptyImagePath}/not-found-wallet.svg')`,
        "empty-pool": `url('${emptyImagePath}/pool.svg')`,
        "empty-wallet": `url('${emptyImagePath}/wallet.svg')`,
        "empty-url": `url('${emptyImagePath}/url.svg')`,
        "empty-no-data": `url('${emptyImagePath}/no-data.svg')`,
        "empty-lock": `url('${emptyImagePath}/lock.svg')`,
        "empty-import-list": `url('${emptyImagePath}/import-list.svg')`,

        "account-card-pattern": "url('/images/account-bg.svg')",
        "drag-and-drop-dashed-pattern":
          "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%2370C59EFF' stroke-width='1' stroke-dasharray='8' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")",
        "drag-and-drop-dashed-pattern-error":
          "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%23CD8C8CFF' stroke-width='1' stroke-dasharray='8' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")",

        // empty state gradients
        "gradient-empty-state-green-dark":
          "linear-gradient(229.81deg, #4D5F5D -62.55%, #262B28 75.05%)",
        "gradient-empty-state-green-light":
          "linear-gradient(220.65deg, #4D5F5D -14.6%, #2C2F2D 75.96%)",
        "gradient-empty-state-grey-light":
          "linear-gradient(220.65deg, #555555 -14.6%, #292A2A 75.96%)",
        "gradient-empty-state-grey-dark":
          "linear-gradient(214.18deg, #2E2F2F -10.66%, #262626 95.55%)",
        "gradient-empty-state-purple-dark":
          "linear-gradient(214.18deg, #4A4A58 -10.66%, #21202A 95.55%)",
        "gradient-empty-state-purple-light":
          "linear-gradient(211.18deg, #635F78 0%, #29273C 84.73%)",

        //navigation
        "navigation-active":
          "linear-gradient(180deg, #0F0F0F -6.77%, #283633 87.04%, #7DA491 100%)",
        "navigation-hover": "linear-gradient(180deg, #0F0F0F -6.77%, #3B4E47 100%)",
        "navigation-active-mobile":
          "linear-gradient(270deg, #1D1E1E 13.5%, #283633 97.85%, #7DA491 100%)",

        //cards
        "gradient-card-blue-light-fill": "linear-gradient(90deg, #1E2022 0%, #445259 100%)",
        "gradient-card-green-light-fill": "linear-gradient(90deg, #1F2020 0%, #3C4B4A 100%)",

        "gradient-card-blue-dark-fill": "linear-gradient(78.4deg, #21272C 4.02%, #5C6369 111.77%)",
        "gradient-card-green-dark-fill": "linear-gradient(78.4deg, #212C26 4.02%, #667471 111.77%)",
        "gradient-card-purple-dark-fill":
          "linear-gradient(78.4deg, #2C2636 4.02%, #51477D 111.77%)",

        "gradient-card-blue-dark-border":
          "linear-gradient(251.06deg, #627985 11.76%, #2A3A45 59.71%)",
        "gradient-card-green-dark-border":
          "linear-gradient(251.06deg, #6D8C7D 11.76%, #3C4C4A 59.71%)",
        "gradient-card-purple-dark-border":
          "linear-gradient(251.06deg, #7E71AD 11.76%, #3D354D 59.71%)",

        "gradient-card-account": "linear-gradient(90deg, #1F2020 0%, #3C4B4A 100%);",

        "table-gradient": "linear-gradient(to bottom, #2E2F2F 60px, #1D1E1E 60px, #1D1E1E 100%)",
      },
      keyframes: {
        appear: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "80%, 100%": { transform: "rotate(360deg)" },
        },
        swap: {
          "0%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(-90deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        list: {
          "0%": { backgroundColor: "theme('colors.green-bg')" },
          "100%": { backgroundColor: "theme('colors.tertiary-bg')" },
        },
        flicker1: {
          "0%": { opacity: "0.3" },
          "25%": { opacity: "1" },
          "50%, 100%": { opacity: "0.3" },
        },
        flicker2: {
          "0%, 25%": { opacity: "0.3" },
          "50%": { opacity: "1" },
          "75%, 100%": { opacity: "0.3" },
        },
        flicker3: {
          "0%, 50%": { opacity: "0.3" },
          "75%": { opacity: "1" },
          "100%": { opacity: "0.3" },
        },
      },
      animation: {
        orbit: "orbit ease-in-out 1.5s infinite",
        swap: "swap ease-in-out 0.5s",
        list: "list ease-in-out 2s",
        flicker1: "flicker1 ease-in 1.5s infinite",
        flicker2: "flicker2 ease-in 1.5s infinite",
        flicker3: "flicker3 ease-in 1.5s infinite",
        appear: "appear ease-in 1.3s",
      },
      gridTemplateRows: {
        layout: "auto 1fr auto",
      },
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      // main background colors

      "primary-bg": "#1D1E1E",
      "secondary-bg": "#0F0F0F",
      "tertiary-bg": "#272727",
      "quaternary-bg": "#2E2F2F",

      // core colors

      green: "#7DA491",
      orange: "#AF9A7A",
      yellow: "#ECD245",
      "yellow-light": "#D2BD8B",
      red: "#D24B4B",
      "red-light": "#CD8C8C",
      "red-light-shadow": "#C0A0A0",
      blue: "#7D97A4",
      purple: "#8089BD",

      black: "#000000",
      white: "#FFFFFF",

      // snackbar, badges, warnings colored backgrounds

      "green-bg": "#3C4C4A",
      "red-bg": "#443535",
      "orange-bg": "#4A4237",
      "blue-bg": "#2A3A45",
      "purple-bg": "#3C3D4C",

      "erc-20-bg": "#434B4A",
      "erc-223-bg": "#44434B",

      "global-bg": "#0F0F0F",

      // hover colors

      "green-hover": "#A5E7C5",
      "green-bg-hover": "#495C5A",
      "green-hover-icon": "#A5E7E6",
      "red-light-hover": "#F6B4B4",
      "red-hover": "#DA5D57",
      "purple-hover": "#A5AEE7",
      "purple-bg-hover": "#56586F",
      "purple-hover-icon": "#B8C4FF",
      "blue-hover": "#96B5C4",
      "orange-hover": "#B89158",

      "primary-text": "#D1DEDF",
      "secondary-text": "#A2AAA9",
      "tertiary-text": "#798180",

      "erc-20-text": "#97B9B6",
      "erc-223-text": "#949ED4",

      "primary-border": "#575A58",
      "secondary-border": "#383C3A",

      "erc-20-border": "#97B9B6",
      "erc-223-border": "#949ED4",
    },
    spacing: {
      "0": "0px",
      px: "1px",
      "0.5": "2px",
      "1": "4px",
      "1.5": "6px",
      "2": "8px",
      "2.5": "10px",
      "3": "12px",
      "3.5": "14px",
      "4": "16px",
      "5": "20px",
      "5.5": "22px",
      "6": "24px",
      "7": "28px",
      "8": "32px",
      "9": "36px",
      "10": "40px",
      "11": "44px",
      "12": "48px",
    },
    borderRadius: {
      "0": "0px",
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "5": "20px",
      "20": "80px",
      full: "50%",
    },
    fontSize: {
      0: ["0px", "0px"],
      8: ["8px", "12px"],
      10: ["10px", "14px"],
      12: ["12px", "16px"],
      14: ["14px", "20px"],
      16: ["16px", "24px"],
      18: ["18px", "28px"],
      20: ["20px", "32px"],
      24: ["24px", "40px"],
      32: ["32px", "48px"],
      40: ["40px", "48px"],
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    require("@savvywombat/tailwindcss-grid-areas"),
    require("tailwind-scrollbar")({ preferredStrategy: "pseudoelements", nocompatible: true }),
    plugin(function ({ addVariant, e }) {
      addVariant("hocus", ["&:hover", "&:focus-visible"]);
      addVariant("group-hocus", [".group:hover &", ".group:focus-visible &"]);
      addVariant("peer-hocus", [".peer:hover ~ &", ".peer:focus-visible ~ &"]);
    }),
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-shadow": {
          textShadow: "0px 0px 8px var(--tw-shadow-color)",
        },
      };

      addUtilities(newUtilities, ["responsive", "hover"]);
    },
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
export default config;
