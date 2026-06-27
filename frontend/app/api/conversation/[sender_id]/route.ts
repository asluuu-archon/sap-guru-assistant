import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sender_id: string }> }
) {
  const { sender_id } = await params;

  const res = await fetch(
    `https://sap-guru-assistant.onrender.com/conversation/${sender_id}`,
    { cache: "no-store" }
  );

  const data = await res.json();
  return NextResponse.json(data);
}