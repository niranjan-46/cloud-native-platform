"use client";

import styles from "./page.module.css";
import { useEffect, useState, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import { FiHome, FiUser, FiSettings, FiHelpCircle, FiLogOut} from 'react-icons/fi';
import { FaGavel, FaClipboardList, FaBriefcase, FaCrown, FaGem } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import TopNavbar from "@/components/consultancy/TopNavbar";
import DashboardSidebar from "@/components/consultancy/DashboardSidebar";
import { usePathname } from "next/navigation";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import Cookies from 'js-cookie';
import { ProfileContext } from "@/context/shared/Profile";

import {
  Star,         // For premium plans
  WorkspacePremium,  // For premium features
  AutoRenew,    // For auto-renewal
  CalendarToday, // For billing cycles
  Payment,      // For payments
  CreditCard,   // For card payments
  Receipt,      // For invoices
  Discount,     // For discounts
  GppGood,      // For security
  CheckCircle   // For included features
} from '@mui/icons-material';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardLayout({ children }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { profileData, setProfileData } = useContext(ProfileContext);

  useEffect(() => {
    // for css import
    if (location.pathname.startsWith('/dashboard')) {
      import('./dashboard.globals.css');
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pathname = usePathname();
  
  const menuItems = [
    { icon: <FiHome />, label: "Dashboard", link: "/dashboard/consultancy", active: pathname === "/dashboard/consultancy" },
    // { icon: <FaGavel />, label: "Make a Bid", link: "/dashboard/consultancy/post-job", active: pathname === "/dashboard/consultancy/post-job" },
    { icon: <FaClipboardList />, label: "Your Bids", link: "/dashboard/consultancy/your-bids", active: pathname === "/dashboard/consultancy/your-bids" },
    { icon: <FaBriefcase />, label: "Job Listings", link: "/dashboard/consultancy/job-listing", active: pathname === "/dashboard/consultancy/job-listing" },
    { icon: <FiUser />, label: "My Profile", link: "/dashboard/consultancy/my-profile", active: pathname === "/dashboard/consultancy/my-profile" },
    { icon: <FaGem />, label: "Plan Usage", link: "/dashboard/consultancy/plan-usage", active: pathname === "/dashboard/consultancy/plan-usage" },
  ];

  const footerItems = [
    { icon: <FiSettings />, label: "Settings", link: "/dashboard/consultancy/settings", active: pathname === "/dashboard/consultancy/settings" },
    { icon: <FiHelpCircle />, label: "Help Center", link: "/dashboard/consultancy/help-center", active: pathname === "/dashboard/consultancy/help-center" },
    { icon: <FiLogOut />, label: "Log Out", link: "#" },
  ];

  const handleMenuClick = () => {
    setShowSidebar(!showSidebar);
    if (!showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/profile/`, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    fetchProfileData();
  }, []);

  return (
    <div className={styles.wrapper}>
      <TopNavbar 
        isMobile={isMobile} 
        showSidebar={showSidebar} 
        handleMenuClick={handleMenuClick} 
      />

      <AnimatePresence>
        {(showSidebar || !isMobile) && (
          <DashboardSidebar 
            isMobile={isMobile}
            showSidebar={showSidebar}
            menuItems={menuItems}
            footerItems={footerItems}
            profileData={profileData}
            onCloseSidebar={() => {
              setShowSidebar(false);
              document.body.style.overflow = 'auto';
            }}
          />
        )}
      </AnimatePresence>

      <div className={`${styles.container}`}>
        {children}
      </div>

      
    </div>
  );
}