import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
   "/sign-in(.*)",
   "/sign-up(.*)",
   "/",
])

const isPublicApiRoute = createRouteMatcher([
  "/api/video",
  "/api/subtitle-generator",
  "/api/test"
])


export default clerkMiddleware(async (authData, req) => {
  const { userId } = await authData();
  const currentUrl = new URL(req.url)
  const isApiRequest = currentUrl.pathname.startsWith("/api")

  // Redirect authenticated users from landing page and auth pages to home
  if (userId && (currentUrl.pathname === "/" || currentUrl.pathname.startsWith("/sign-in") || currentUrl.pathname.startsWith("/sign-up"))) {
    return NextResponse.redirect(new URL("/home", req.url))
  }

  // Handle unauthenticated users
  if (!userId) {
    // Redirect to sign-in if accessing protected routes
    if (!isPublicRoute(req) && !isPublicApiRoute(req)) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    // Redirect to sign-in if accessing protected API routes
    if (isApiRequest && !isPublicApiRoute(req)) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)","/","/(api|trpc)(.*)"
  ],
}