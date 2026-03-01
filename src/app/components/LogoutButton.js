"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt, FaSpinner } from 'react-icons/fa';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      // Clear all cookies
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Clear any localStorage items if they exist
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
      onClick={handleLogout}
      className="dropdown-item d-flex align-items-center gap-2 text-gray-700 hover:text-red-600 transition-colors duration-200"
      disabled={isLoading}
    >
      {isLoading ? (
        <FaSpinner className="animate-spin" />
      ) : (
        <FaSignOutAlt className="text-red-500" />
      )}
      <span className={isLoading ? 'text-gray-500' : ''}>
        {isLoading ? 'Logging out...' : 'Logout'}
      </span>
    </button>
  );
} 