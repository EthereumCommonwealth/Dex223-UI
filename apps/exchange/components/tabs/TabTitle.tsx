import clsx from "clsx";
import React from "react";

interface Props {
  title: string;
  index: number;
  selectedTab: number;
  setSelectedTab: (index: number) => void;
  fullWidth?: boolean;
}

function TabTitle({ title, setSelectedTab, index, selectedTab, fullWidth }: Props) {
  return (
    <li
      role="button"
      className={clsx(
        "duration-200 hocus:bg-green-bg py-2.5 px-6 flex justify-center border rounded-2",
        index === selectedTab
          ? "bg-green-bg text-primary-text border-green"
          : "bg-secondary-bg text-secondary-text border-transparent",
        fullWidth && "w-full",
      )}
      onClick={() => setSelectedTab(index)}
    >
      {title}
    </li>
  );
}

export default TabTitle;
