import { clsxMerge } from "@/functions/clsxMerge";

// Same look as the app's <Badge color="green_outline" />.
export default function ComingSoonBadge({ text, className }: { text: string; className?: string }) {
  return (
    <div
      className={clsxMerge(
        "rounded-5 px-2 font-medium box-border text-nowrap text-12 py-0.5 text-green shadow-[0_0_0_1px_theme(colors.green-bg)_inset]",
        className,
      )}
    >
      {text}
    </div>
  );
}
