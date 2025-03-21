import Tooltip from "@repo/ui/tooltip";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet corporis delectus fuga magnam voluptates?",
  },
};
