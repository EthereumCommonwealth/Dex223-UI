import { notFound } from "next/navigation";

// Any path under a locale that no route matches renders the localized not-found page.
export default function CatchAllPage() {
  notFound();
}
