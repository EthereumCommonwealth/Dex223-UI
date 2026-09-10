import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const API_URL = `https://api.simpleswap.io/create_exchange?api_key=${process.env.SIMPLE_SWAP_API_KEY}`;

  // Not logged: this body carries the user's destination wallet address and the
  // amounts being purchased, and it is sent on every onramp order.
  const body = await request.json();

  try {
    const response = await fetch(API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(body),
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
