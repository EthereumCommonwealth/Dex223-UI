import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The short DEX223 logo as a data URI, for ImageResponse routes (icons and share images). */
export async function brandMarkDataUri(): Promise<string> {
  const svg = await readFile(join(process.cwd(), "public/images/logo-short.svg"), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
