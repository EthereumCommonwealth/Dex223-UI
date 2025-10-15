import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const currencyFrom = searchParams.get("currencyFrom");
  const currencyTo = searchParams.get("currencyTo");
  const isFixed = searchParams.get("fixed");

  if (!currencyTo || !currencyFrom) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const API_URL = `https://api.simpleswap.io/get_ranges?api_key=${process.env.NEXT_PUBLIC_SIMPLE_SWAP_API_KEY}&fixed=${isFixed}&currency_from=${currencyFrom}&currency_to=${currencyTo}`;

  try {
    const response = await fetch(API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const resBody = await response.json();

    return NextResponse.json(resBody, {
      status: response.status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
