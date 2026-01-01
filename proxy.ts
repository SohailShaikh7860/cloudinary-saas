import { auth, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
   "/signin",
   "/signup",
   "/",
   "/home"
])

const isPublicApiRoute = createRouteMatcher([
  "/api/videos"
])


export default clerkMiddleware((auth,req)=>{
  const {userId} = auth();
  const currentUrl = new URL(req.url)
  const isHomePage = currentUrl.pathname === "/home"
  const isApiRequest = currentUrl.pathname.startsWith("/api")

  if(userId && isPublicRoute(req) && !isHomePage){
    return NextResponse.redirect(new URL("/home", req.url))
  }

  if(!userId){
      if(!isPublicApiRoute(req) && !isPublicApiRoute(req)){
        return NextResponse.redirect(new URL("/signin", req.url))
      }

      if(isApiRequest && isPublicApiRoute(req)){
         return NextResponse.redirect(new URL("/signin", req.url))
      }
  }

})

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)","/","/(api|trpc)(.*)"
  ],
}