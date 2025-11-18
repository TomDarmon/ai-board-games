import { getCookieCache } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const publicRoutes = ["/login", "/signup"];

// Routes that should always be accessible (API, static files, etc.)
const alwaysAccessiblePatterns = [
	"/api/auth", // Better Auth API routes
	"/_next", // Next.js internals
	"/favicon.ico",
];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Allow always accessible routes
	if (
		alwaysAccessiblePatterns.some((pattern) => pathname.startsWith(pattern))
	) {
		return NextResponse.next();
	}

	// Check if the route is a dashboard route (requires authentication)
	const isDashboardRoute = pathname.startsWith("/dashboard");

	// Check if the route is public
	const isPublicRoute = publicRoutes.includes(pathname) || pathname === "/";

	// Get the session from cookie cache (Edge Runtime compatible)
	const session = await getCookieCache(request, {
		cookiePrefix: "better-auth",
	});

	// If user is not authenticated and trying to access a dashboard route
	if (!session && isDashboardRoute) {
		const url = new URL("/login", request.url);
		url.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(url);
	}

	// If user is authenticated and trying to access login/signup, redirect to dashboard
	if (session && isPublicRoute && !isDashboardRoute) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 * - files with extensions (e.g. .png, .jpg, .css, .js)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
	],
};
