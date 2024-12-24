import Image from "next/image";

const emptyStateIconUrlMap = {
  assets: "/images/empty/empty-assets.svg",
  edit: "/images/empty/empty-edit.svg",
  history: "/images/empty/empty-history.svg",
  imported: "/images/empty/empty-imported.svg",
  list: "/images/empty/empty-list.svg",
  pair: "/images/empty/empty-pair.svg",
  poolList: "/images/empty/empty-pool-list.svg",
  pool: "/images/empty/empty-pool-new.svg",
  search: "/images/empty/empty-search.svg",
  "search-list": "/images/empty/empty-search-list.svg",
  wallet: "/images/empty/empty-wallet-new.svg",
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
  size = 340,
  className,
}: {
  iconName: EmptyIconName;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      width={size}
      height={size}
      src={emptyStateIconUrlMap[iconName]}
      alt=""
      className={className}
    />
  );
}
