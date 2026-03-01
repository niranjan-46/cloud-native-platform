'use client';

import { useGoogleLogin } from '@react-oauth/google';
import Image from 'next/image';
import styles from '@/app/login/Login.module.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        const userInfo = await response.json();
        // console.log("google login user info: ",userInfo);


        // Now send ID token or email to your backend
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token }), // Using access_token to match backend
        });

        const data = await backendRes.json();
        // console.log("google login data response: ",data);

        

        if (backendRes.ok) {

          const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/me/`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.access}`,
              "Content-Type": "application/json",
            },
            credentials: 'include',
          });
          const profileData = await profileResponse.json();

          const userProfile = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/profile/`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.access}`,
              "Content-Type": "application/json",
            },
            credentials: 'include',
          });
          const userProfileData = await userProfile.json();

          if((!profileData.completed_steps) || (userProfileData.profile.application_status !== "approved")){
            try {
              const registrationData = {
                email: profileData.email,
                access: data.access,
                user_type: profileData.user_type,
                reg_step: profileData.registration_step,
                reg_user_id: profileData.id,
                reg_completed_steps: profileData.completed_steps,
                reg_application_status: userProfileData.profile.application_status
              };
            
              Cookies.set('registrationData', JSON.stringify(registrationData), {
                expires: 0.0208, // 30 minutes
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict'
              });
              
              
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
              console.log(`${reg_stepMap[profileData.user_type][profileData.registration_step-1]}`);
              router.push(`${reg_stepMap[profileData.user_type][profileData.registration_step-1]}`);
            } catch (err) {
              console.error('Cookie set failed:', err);
              setError('Unable to store registration data. Please try again.' );
              return;
            }
          }else{
            Cookies.set('access_token', data.access, {
              expires: 1,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Strict',
              path: '/'
            });
            Cookies.set('refresh_token', data.refresh, {
              expires: 1,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Strict',
              path: '/'
            });
            Cookies.set('user_type', data.user_type, {
              expires: 1,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Strict',
              path: '/'
            });
            Cookies.set('email', profileData.email, {
              expires: 1,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Strict',
              path: '/'
            });
            // document.cookie = `access_token=${data.access}; path=/; max-age=3600`;
            // document.cookie = `refresh_token=${data.refresh}; path=/; max-age=604800`;
            // document.cookie = `user_type=${data.user_type}; path=/; max-age=3600`;
            router.push(`/dashboard/${data.user_type}`);
          }

        }else{
          setError(data.error);
          if(data.error === "User not found"){
            Cookies.set('google_reg_user', JSON.stringify(data), { 
              expires: 0.0208, // 30 minutes
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Strict',
              path: '/'
            });
            // sessionStorage.setItem('registrationData', JSON.stringify(data)); // Saveing the data to sessionStorage
            router.push("/register?no_account=1");
          }
          // console.log("google login error: ",data);
        }
      } catch (err) {
        console.error('Google login error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      console.log('Google Login Failed');
    },
    scope: 'openid email profile',
  });

  return (
    <button
      onClick={() => login()}
      className={`${styles.socialbtn} btn btn-outline-secondary w-100 mb-2 py-2 rounded-4`}
      style={{ height: '42px', fontSize: '14px' }}
    >
      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <span className={`${styles.secoundarytext}`}>Continue with Google</span>
                        </>
                      ) : (
                        <>
                        <Image width={18} height={18} src="/login/google.svg" alt="Google" className="me-2 mb-1" />
                        <span className={`${styles.secoundarytext}`}>Continue with Google</span>
                        </>
                  )}
    </button>
  );
}
