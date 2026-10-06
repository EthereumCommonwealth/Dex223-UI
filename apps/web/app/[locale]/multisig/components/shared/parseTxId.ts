/** A multisig transaction id typed by the user: digits only, else null (treated as not found). */
export default function parseTxId(value: string): bigint | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}
