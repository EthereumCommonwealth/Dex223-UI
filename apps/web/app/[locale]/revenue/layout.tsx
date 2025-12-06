import { Metadata } from "next";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Revenue",
};
export default function Layout({ children }: PropsWithChildren) {
  return <div className="overflow-x-hidden w-full">{children}</div>;
}
