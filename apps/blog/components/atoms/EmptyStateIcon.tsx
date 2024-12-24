import Image from "next/image";

const emptyStateIconUrlMap = {
  assets: "/images/empty/empty-assets.svg",
  edit: "/images/empty/empty-edit.svg",
  history: "/images/empty/empty-history.svg",
  imported: "/images/empty/empty-imported.svg",
  list: "/images/empty/empty-list.svg",
  pair: "/images/empty/empty-pair.svg",
  pool: "/images/empty/empty-pool.svg",
  search: "/images/empty/empty-search.svg",
  "search-list": "/images/empty/empty-search-list.svg",
  wallet: "/images/empty/empty-wallet.svg",
  custom: "/images/empty/empty-custom-tokens.svg",
  tokens: "/images/empty/empty-tokens.svg",
  warning: "/images/empty/empty-warning.svg",
  autolisting: "/images/empty/empty-autolisting.svg",
  "deposited-tokens": "/images/empty/empty-deposited-tokens.svg",
  "margin-positions": "/images/empty/empty-margin-positions.svg",
  "lending-orders": "/images/empty/empty-lending-orders.svg",
  "search-autolisting": "/images/empty/empty-autolisting-search.svg",
};

type EmptyIconName = keyof typeof emptyStateIconUrlMap;

export default function EmptyStateIcon({
  iconName,
  size = 80,
}: {
  iconName: EmptyIconName;
  size?: number;
}) {
  return <Image width={size} height={size} src={emptyStateIconUrlMap[iconName]} alt="" />;
}
