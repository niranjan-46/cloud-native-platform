import Cookies from 'js-cookie';

export function storeRegistrationCredentials(data) {
  const isProd = process.env.NODE_ENV === 'production';
  const expiresInMinutes = 30;
  
  // Create expiration date (30 minutes from now)
  const expires = new Date(new Date().getTime() + expiresInMinutes * 60 * 1000);

  // Loop through formData and set each field as a cookie
  Object.entries(data).forEach(([key, value]) => {
    Cookies.set(key, value, {
      expires: expires, 
      secure: true,
      sameSite: 'Strict',
      path: '/',
    });
  });
}