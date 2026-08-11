import { NextResponse, type NextRequest } from "next/server";
import { createClientProxy, isSupabaseConfigured } from "@/lib/supabase";

const protectedRoutes = ["/profile", "/dashboard"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected || !isSupabaseConfigured()) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createClientProxy(request, response);
  if (!supabase) return NextResponse.next();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
