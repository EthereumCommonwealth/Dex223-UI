import BuyCryptoPageClient from "./components/BuyCryptoPageClient";

export default async function BuyCryptoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const res = await fetch(
    `https://api.simpleswap.io/get_all_currencies?api_key=${process.env.SIMPLE_SWAP_API_KEY}`,
    {
      next: { revalidate: 60 },
    },
  );

  if (!res.ok) {
    console.error("Failed to fetch initial tokens");
    throw new Error("Failed to fetch initial tokens");
  }

  const initialTokensFrom = await res.json();

  const params = await searchParams;
  const exchangeId = params.exchangeId;
  let dataExchange;

  try {
    const resExchange = await fetch(
      `https://api.simpleswap.io/get_exchange?id=${exchangeId}&api_key=${process.env.SIMPLE_SWAP_API_KEY}`,
    );

    if (resExchange.ok) {
      dataExchange = await resExchange.json();
    }
  } catch (e) {
    console.log(e);
  }

  return <BuyCryptoPageClient tokens={initialTokensFrom} initialExchange={dataExchange} />;
}
