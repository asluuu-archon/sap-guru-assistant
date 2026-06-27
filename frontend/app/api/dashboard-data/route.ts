import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://sap-guru-assistant.onrender.com/dashboard-data", {
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data);
}