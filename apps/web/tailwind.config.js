const emptyImagePath = "/images/empty-large";

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@repo/tailwind-config/tailwind-presets")],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      backgroundImage: {
        "empty-no-pinned-tokens": `url('${emptyImagePath}/no-pinned.svg')`,
      },
    },
  },
};
