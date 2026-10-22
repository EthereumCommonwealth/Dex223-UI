import Container from "@/components/atoms/Container";
import { Link } from "@/i18n/routing";

export default function MarginRecordMissing({
  title,
  backLabel,
}: {
  title: string;
  backLabel: string;
}) {
  return (
    <Container className="py-10">
      <Link className="block mb-5" href="/margin-trading">
        {backLabel}
      </Link>
      <h1 className="text-24">{title}</h1>
    </Container>
  );
}
