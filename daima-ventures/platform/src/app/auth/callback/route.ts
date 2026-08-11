import { NextResponse, type NextRequest } from "next/server";
import { createClientProxy } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createClientProxy(request, response);
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
      }
    }
    return response;
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
