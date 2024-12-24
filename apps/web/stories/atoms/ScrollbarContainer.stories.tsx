import { Meta, StoryObj } from "@storybook/react";

import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";

const meta = {
  title: "Atoms/ScrollbarContainer",
  component: ScrollbarContainer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollbarContainer>;

export default meta;
type Story = StoryObj<typeof ScrollbarContainer>;

export const DefaultScrollbarContainer: Story = {
  args: {
    height: 500,
    children: (
      <div style={{ width: 300 }} className="-mx-2 px-2 w-[300px]">
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
        <div className="bg-tertiary-bg py-2 px-2">Row1</div>
      </div>
    ),
  },
};
