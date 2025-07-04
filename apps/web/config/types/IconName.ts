export const svgIconsNames = [
  "previous",
  "next",
  "arrow-up",
  "arrow-bottom",
  "high",
  "low",
  "swap",
  "search",
  "no-transaction",
  "staked",
  "soon",
  "help-outline",
  "close",
  "back",
  "edit",
  "copy",
  "logout",
  "error",
  "sun",
  "night",
  "delete",
  "show",
  "hide",
  "star",
  "minus",
  "supreme",
  "select",
  "chart",
  "custom-tokens",
  "no-favorite-tokens",
  "percent",
  "calculate",
  "add",
  "more",
  "web3",
  "login",
  "check",
  "info",
  "menu",
  "columns",
  "rows",
  "collaboration",
  "shield",
  "power",
  "secure",
  "haven",
  "hotspots",
  "sloth-farming-101",
  "harvest",
  "platform",
  "whitepaper",
  "system",
  "ui",
  "farm",
  "done",
  "listing",
  "safe-trading",
  "burn",
  "boost",
  "dex-stats",
  "liquidity",
  "orders",
  "warning",
  "home",
  "tokenomic",
  "roadmap",
  "bridge",
  "tutorial",
  "arrow-right",
  "drop",
  "token-to-share",
  "pool",
  "zoom-out",
  "zoom-in",
  "settings",
  "filter",
  "history",
  "wallet",
  "candle",
  "trading",
  "line",
  "table",
  "sound",
  "lottery",
  "expand-arrow",
  "success",
  "etherscan",
  "to-top",
  "borrow",
  "gas",
  "question",
  "pin",
  "pin-fill",
  "double-arrow",
  "closed",
  "forward",
  "import",
  "details",
  "download",
  "list",
  "recent-transactions",
  "collect",
  "deposit",
  "withdraw",
  "small-expand-arrow",
  "medium-trust",
  "low-trust",
  "high-trust",
  "telegram",
  "x",
  "discord",
  "gas-edit",
  "cheap-gas",
  "custom-gas",
  "fast-gas",
  "auto-increase",
  "margin-trading",
  "portfolio",
  "token",
  "import-token",
  "import-list",
  "reset",
  "pools",
  "convert",
  "sort",
  "change-network",
  "arrow-in",
  "listing-details",
  "duplicate-found",
  "warning-outline",
  "speed-up",
  "cancel",
  "sort-up",
  "sort-down",
  "file",
  "guidelines",
  "blog",
  "statistics",
  "author",
  "date",
  "youtube",
  "crypto-exchange",
  "lending",
] as const;

export const socialIconNames = [""] as const;

export const emptyIconNames = ["wallet", "search", "pool", "list", "assets"] as const;

export type IconName = (typeof svgIconsNames)[number];
export type SocialIconName = (typeof socialIconNames)[number];
export type EmptyIconName = (typeof emptyIconNames)[number];
