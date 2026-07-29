import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MOBILE_PATTERNS = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i;

function isMobile(request: NextRequest): boolean {
  const ua = request.headers.get('user-agent') || '';
  return MOBILE_PATTERNS.test(ua);
}

const PUBLIC_FILES = /\.(.*)$/;
const API_ROUTES = /^\/api\//;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (API_ROUTES.test(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_FILES.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/mobile')) {
    return NextResponse.next();
  }

  if (isMobile(request)) {
    const mobilePath = `/mobile${pathname === '/' ? '' : pathname}`;
    const url = request.nextUrl.clone();
    url.pathname = mobilePath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api|fonts|screenshots|weather-ico|manifest.webmanifest|icon\\.png|favicon\\.ico).*)',
  ],
};
