import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const amount = searchParams.get("amount");
  const currencyFrom = searchParams.get("currencyFrom");
  const currencyTo = searchParams.get("currencyTo");
  const isFixed = searchParams.get("fixed");

  if (!amount || !currencyFrom || !currencyTo) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const API_URL = `https://api.simpleswap.io/get_estimated?api_key=${process.env.SIMPLE_SWAP_API_KEY}&fixed=${isFixed}&currency_from=${currencyFrom}&currency_to=${currencyTo}&amount=${amount}`;

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
