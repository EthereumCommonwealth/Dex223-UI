"use client";

import { Link } from "@/i18n/routing";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

export default function GuideCta({
  href,
  label,
  action,
}: {
  href: string;
  label: string;
  action?: "token-lists";
}) {
  const {
    setIsOpen: setManageTokensOpen,
    setActiveTab: setManageTokensActiveTab,
    setContent: setManageTokensContent,
  } = useManageTokensDialogStore();

  if (action === "token-lists") {
    return (
      <button
        type="button"
        onClick={() => {
          setManageTokensContent("default");
          setManageTokensActiveTab(0);
          setManageTokensOpen(true);
        }}
        className="inline-flex items-center justify-center h-12 px-5 rounded-3 bg-green text-primary-bg font-medium hocus:bg-green-hover duration-200"
      >
        {label}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center h-12 px-5 rounded-3 bg-green text-primary-bg font-medium hocus:bg-green-hover duration-200"
    >
      {label}
    </Link>
  );
}
