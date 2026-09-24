// "7 April 2026" / "April 7, 2026" / "2026年4月7日", depending on the reader's locale.
// A numeric 12.04.2024 reads as April in Europe and December in the US.
export function formatPostDate(date: string, locale: string, month: "long" | "short" = "long") {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
