import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const RPC_URL = "https://rpc.testnet.mantle.xyz";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("RPC Error:", response.status, await response.text());
      return NextResponse.json(
        { error: "RPC request failed", status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("RPC Proxy Error:", error);
    return NextResponse.json(
      { error: "RPC request failed", message: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
