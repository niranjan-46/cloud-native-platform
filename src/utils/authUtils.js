import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export const handleTokenExpiration = (error, router) => {
  if (error?.code === 'token_not_valid' || error?.detail === 'Given token not valid for any token type') {
    // Clear any existing tokens and registration data
    Cookies.remove('registrationData', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });
    Cookies.remove('access_token', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });
    Cookies.remove('refresh_token', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });
    
    // Redirect to login page
    router.push('/login');
    return true;
  }
  return false;
};

export const isAuthenticated = () => {
  const registrationData = Cookies.get('registrationData');
  const accessToken = Cookies.get('access_token');
  return !!(registrationData || accessToken);
}; 