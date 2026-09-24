import clsx from "clsx";
import React, { KeyboardEvent, ReactElement, ReactNode, useState } from "react";

import TabTitle from "./TabTitle";

interface Props {
  children: ReactElement[];
  defaultTab?: number;
  activeTab?: number;
  setActiveTab?: any;
  fullWidth?: boolean;
  colorScheme?: "primary" | "secondary";
  rightContent?: ReactNode;
}

function Tabs({
  children,
  defaultTab = 0,
  activeTab = 0,
  setActiveTab = null,
  fullWidth = false,
  colorScheme = "primary",
  rightContent,
}: Props) {
  const [selectedTab, setSelectedTab] = useState(defaultTab || 0);

  const currentTab = activeTab || selectedTab;
  const selectTab = setActiveTab || setSelectedTab;

  // Arrow keys, Home and End move between tabs, as in the WAI-ARIA tabs pattern.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = children.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = currentTab === last ? 0 : currentTab + 1;
    if (e.key === "ArrowLeft") next = currentTab === 0 ? last : currentTab - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;

    e.preventDefault();
    selectTab(next);
    const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[next]?.focus();
  };

  return (
    <div>
      {/* On phones the action next to the tabs moves onto its own row instead of squeezing them. */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div
          role="tablist"
          onKeyDown={handleKeyDown}
          className={clsx(
            // A tab strip with several titles is wider than a phone viewport and
            // cannot shrink, which used to push the whole document sideways. Let it
            // scroll within its own track instead.
            // min-w-0 is what actually lets this shrink: a flex item will not go
            // below its content width without it, so overflow-x-auto never engaged
            // and the strip pushed the whole document sideways instead.
            "inline-flex rounded-3 p-1 gap-1 max-w-full min-w-0 overflow-x-auto no-scrollbar",
            fullWidth && "w-full",
            colorScheme === "primary" ? "bg-primary-bg" : "bg-secondary-bg",
          )}
        >
          {children.map((item, index) => (
            <TabTitle
              colorScheme={colorScheme}
              fullWidth={fullWidth}
              key={index}
              selectedTab={currentTab}
              title={item.props.title}
              index={index}
              setSelectedTab={selectTab}
            />
          ))}
        </div>
        {rightContent}
      </div>

      {children[currentTab]}
    </div>
  );
}

export default Tabs;
