import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isApiRoute = pathname.startsWith('/api/')
  const isStatic = pathname.startsWith('/_next') || pathname === '/favicon.ico'

  // Never touch API or static routes
  if (isApiRoute || isStatic) return NextResponse.next()

  if (!isLoggedIn && !isAuthPage) {
    // Use NEXTAUTH_URL env var to build absolute redirect — avoids localhost loop on Vercel
    const baseUrl = process.env.NEXTAUTH_URL ?? req.nextUrl.origin
    const loginUrl = new URL('/login', baseUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoggedIn && isAuthPage) {
    const baseUrl = process.env.NEXTAUTH_URL ?? req.nextUrl.origin
    return NextResponse.redirect(new URL('/', baseUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
