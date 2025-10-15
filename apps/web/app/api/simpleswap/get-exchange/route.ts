import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const exchangeId = searchParams.get("exchangeId");

  if (!exchangeId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const API_URL = `https://api.simpleswap.io/get_exchange?api_key=${process.env.SIMPLE_SWAP_API_KEY}&id=${exchangeId}`;

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
