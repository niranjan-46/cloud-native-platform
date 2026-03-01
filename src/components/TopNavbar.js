"use client";

import { FiMenu } from 'react-icons/fi';
import styles from '../app/dashboard/candidate/page.module.css';
import { useState, useEffect } from 'react';

export default function TopNavbar({ isMobile, showSidebar, handleMenuClick }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) { // scrolling down
        setIsVisible(false);
      } else { // scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);

    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  return (
    <>
    {isMobile &&(
    <div className={`${styles.topNavbar} ${!isVisible ? styles.hidden : ''}`}>
      <div className={styles.navbarBrand}>
        <h4 style={{ color: '#000000' }}>Zyukthi</h4>
      </div>
      {isMobile && (
        <button
          className={styles.menuToggle}
          onClick={handleMenuClick}
          aria-label="Toggle menu"
        >
          {showSidebar ? '✕' : '☰'}
        </button>
      )}
    </div>
    )}
    </>
  );
} 