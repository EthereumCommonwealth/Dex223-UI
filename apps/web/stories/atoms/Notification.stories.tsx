import type { Meta, StoryObj } from "@storybook/react";

import {
  RecentTransactionStatus,
  RecentTransactionTitleTemplate,
} from "@/stores/useRecentTransactionsStore";

import Notification from "../../components/atoms/Notification";

const meta = {
  title: "Atoms/Notification",
  component: Notification,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Notification>;

export default meta;
type Story = StoryObj<typeof Notification>;

export const Success: Story = {
  args: {
    transactionStatus: RecentTransactionStatus.SUCCESS,
    transactionTitle: {
      template: RecentTransactionTitleTemplate.DEPOSIT,
      symbol: "Native ERC223 token20",
      amount: "9.0099",
      logoURI: "/images/tokens/placeholder.svg",
    },
  },
  render: (args) => {
    return (
      <div style={{ width: 356 }}>
        <Notification {...args} />
      </div>
    );
  },
};

export const Error: Story = {
  args: {
    transactionStatus: RecentTransactionStatus.ERROR,
    transactionTitle: {
      template: RecentTransactionTitleTemplate.DEPOSIT,
      symbol: "Native ERC223 token20",
      amount: "9.0099",
      logoURI: "/images/tokens/placeholder.svg",
    },
  },
  render: (args) => {
    return (
      <div style={{ width: 356 }}>
        <Notification {...args} />
      </div>
    );
  },
};

export const Error_Approve: Story = {
  args: {
    transactionStatus: RecentTransactionStatus.ERROR,
    transactionTitle: {
      template: RecentTransactionTitleTemplate.APPROVE,
      symbol: "sepETH",
      amount: "9.0099",
      logoURI: "/images/tokens/placeholder.svg",
    },
  },
  render: (args) => {
    return (
      <div style={{ width: 356 }}>
        <Notification {...args} />
      </div>
    );
  },
};
