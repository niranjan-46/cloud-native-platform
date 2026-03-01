import { NextResponse } from 'next/server';

export function middleware(request) {
  const fullPath = request.nextUrl.pathname;

  /**
   * 1. REGISTRATION FLOW LOGIC (prioritized first)
   */
  if (fullPath.startsWith('/register')) {
    const cookieValue = request.cookies.get('registrationData')?.value;
    const registrationData = cookieValue ? JSON.parse(cookieValue) : null;

    const reg_email = registrationData?.email;
    const reg_access = registrationData?.access;
    const reg_userType = registrationData?.user_type;
    const reg_step = parseInt(registrationData?.reg_step || '1');
    const reg_completed = registrationData?.reg_completed_steps;
    const reg_application_status = registrationData?.reg_application_status;

    console.log('reg_email', reg_email);
    console.log('reg_access', reg_access);
    console.log('reg_userType', reg_userType);
    console.log('reg_step', reg_step);
    console.log('reg_completed', reg_completed);

    if (reg_completed === 'true'|| reg_application_status === 'approved') {
      const response = NextResponse.redirect(new URL('/login', request.url));
      const reg_cookiesToClear = [
        'registrationData',
      ];
      reg_cookiesToClear.forEach((name) => {
        response.cookies.set(name, '', { maxAge: 0 });
      });
      return response;
    }

    if (!reg_email || !reg_access || !reg_userType) {
      const allowedFirstSteps = [
        '/register',
        '/register/employer',
        '/register/consultancy',
        '/register/candidate',
      ];
      if (allowedFirstSteps.includes(fullPath)) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/register', request.url));
    }

    const reg_stepMap = {
      employer: [
        '/register',
        '/register/employer',
        '/register/employer/professional-details',
        '/register/employer/address',
        '/register/employer/documents-upload',
        '/register/employer/application-status',
      ],
      consultancy: [
        '/register',
        '/register/consultancy',
        '/register/consultancy/professional-details',
        '/register/consultancy/address',
        '/register/consultancy/documents-upload',
        '/register/consultancy/application-status',
      ],
      candidate: [
        '/register',
        '/register/candidate',
        '/register/candidate/additional-details',
        '/register/candidate/education',
        '/register/candidate/experience',
        '/register/candidate/documents-upload',
        '/register/candidate/application-status',
      ],
    };

    const reg_allowedPath = reg_stepMap[reg_userType]?.[reg_step - 1];

    if (!reg_allowedPath) {
      return NextResponse.redirect(new URL('/register', request.url));
    }

    if (fullPath !== reg_allowedPath) {
      return NextResponse.redirect(new URL(reg_allowedPath, request.url));
    }

    return NextResponse.next(); // ✅ Allow correct register path
  }

  /**
   * 2. DASHBOARD AUTH LOGIC (applied if not under /register)
   */
  const dash_isPublicPath =
    fullPath === '/login' ||
    fullPath === '/register' ||
    fullPath === '/forgot-password' ||
    fullPath.startsWith('/reset-password/');

  const dash_accessToken = request.cookies.get('access_token')?.value;
  const dash_userType = request.cookies.get('user_type')?.value;

  if (dash_isPublicPath && dash_accessToken && dash_userType) {
    return NextResponse.redirect(new URL(`/dashboard/${dash_userType}`, request.url));
  }

  if (!dash_isPublicPath && (!dash_accessToken || !dash_userType)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (fullPath.startsWith('/dashboard/') && dash_userType) {
    const dashboardType = fullPath.split('/')[2];
    if (dashboardType !== dash_userType) {
      return NextResponse.redirect(new URL(`/dashboard/${dash_userType}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password/:path*',
    '/register/:path*',
  ],
};
