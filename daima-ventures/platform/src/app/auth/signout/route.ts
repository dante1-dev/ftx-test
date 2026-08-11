import { NextResponse, type NextRequest } from "next/server";
import { createClientProxy } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const supabase = createClientProxy(request, response);
  if (supabase) {
    await supabase.auth.signOut();
  }
  return response;
}
