'use client';

export async function logout(router) {
  try {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    localStorage.clear();


    router.push('/login');
    router.refresh();
  } catch (error) {
    console.error('Logout error:', error);
  }
}
