import type { Meta, StoryObj } from "@storybook/react";

import TrustBadge from "@/components/badges/TrustBadge";
import { Token } from "@/sdk_bi/entities/token";

const meta = {
  title: "Atoms/Trust Badge",
  component: TrustBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TrustBadge>;

export default meta;
type Story = StoryObj<typeof TrustBadge>;

const d223 = new Token(
  1,
  "0x675eb5922604F434bcaAC4B4B433D8668925DD67",
  "0x0908078Da2935A14BC7a17770292818C85b580dd",
  18,
  "D223",
  "Dex223 Token",
);

const copycat = new Token(
  1,
  "0x7f3a000000000000000000000000000000a9c91e",
  "0xc0d20000000000000000000000000000005e1b77",
  18,
  "D223",
  "Dex223 token",
);

export const Official: Story = {
  args: {
    token: d223,
    trust: { level: "high", reason: "official", onCoreList: false, alsoIn: [] },
  },
};

export const CoreListed: Story = {
  args: { token: copycat, trust: { level: "high", reason: "core", onCoreList: true, alsoIn: [] } },
};

export const NotVerified: Story = {
  args: {
    token: copycat,
    trust: { level: "medium", reason: "unverified", onCoreList: false, alsoIn: [] },
  },
};

export const Lookalike: Story = {
  args: {
    token: copycat,
    trust: {
      level: "low",
      reason: "lookalike",
      official: d223,
      match: "name_and_symbol",
      onCoreList: false,
      alsoIn: [],
    },
  },
};
