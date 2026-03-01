"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      localStorage.clear();
      
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to login page
      router.push('/login');
      router.refresh(); // Force a refresh to clear any cached state
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className="btn btn-link text-dark text-decoration-none"
      onClick={handleLogout}
      disabled={isLoading}
    >
      <FiLogOut className="me-2" />
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  );
} 