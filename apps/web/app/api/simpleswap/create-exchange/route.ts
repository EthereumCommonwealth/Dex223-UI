import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const API_URL = `https://api.simpleswap.io/create_exchange?api_key=${process.env.SIMPLE_SWAP_API_KEY}`;

  const body = await request.json();

  console.log(body);

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
