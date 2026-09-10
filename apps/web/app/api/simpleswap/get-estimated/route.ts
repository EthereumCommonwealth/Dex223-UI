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

  // Values arrive from the query string and were previously interpolated raw, so a
  // caller could append their own parameters to the upstream request - this call is
  // made with our API key. URLSearchParams encodes every value.
  const query = new URLSearchParams({
    api_key: process.env.SIMPLE_SWAP_API_KEY ?? "",
    fixed: isFixed ?? "",
    currency_from: currencyFrom,
    currency_to: currencyTo,
    amount,
  });
  const API_URL = `https://api.simpleswap.io/get_estimated?${query.toString()}`;

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
    // The upstream request carries our API key; echoing its failure text back to
    // the caller risks handing over more than intended. Log it, return a fixed message.
    console.error("simpleswap request failed:", error?.message);
    return NextResponse.json({ error: "Upstream request failed" }, { status: 500 });
  }
}
