"use client";

import styles from "./page.module.css";
import { useEffect, useState, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import { FiHome, FiBriefcase, FiBookmark, FiSearch, FiFileText, FiUser, FiSettings, FiHelpCircle, FiLogOut, FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiUsers } from 'react-icons/fi';
import { FaGem } from "react-icons/fa";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import TopNavbar from "@/components/employer/TopNavbar";
import DashboardSidebar from "@/components/employer/DashboardSidebar";
import { usePathname } from "next/navigation";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import Cookies from 'js-cookie';
import { ApplicationsProvider } from "@/context/employer/Applications";
import { PostedJobsProvider } from "@/context/employer/Postedjobs";
import { ReceivedBidsProvider } from "@/context/employer/Receivedbids";
import { ProfileContext } from "@/context/shared/Profile";


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
    { icon: <FiHome />, label: "Dashboard", link: "/dashboard/employer", active: pathname === "/dashboard/employer" },
    { icon: <FiBriefcase />, label: "Post a Job", link: "/dashboard/employer/post-job", active: pathname === "/dashboard/employer/post-job" },
    { icon: <FiUsers />, label: "Applicants", link: "/dashboard/employer/applicants", active: pathname === "/dashboard/employer/applicants" },
    { icon: <FiFileText />, label: "Posted Jobs", link: "/dashboard/employer/posted-jobs", active: pathname === "/dashboard/employer/posted-jobs" },
    { icon: <HiOutlineCurrencyDollar  />, label: "Recived Bids", link: "/dashboard/employer/recived-bids", active: pathname === "/dashboard/employer/recived-bids" },
    { icon: <FiUser />, label: "My Profile", link: "/dashboard/employer/my-profile", active: pathname === "/dashboard/employer/my-profile" },
    { icon: <FaGem />, label: "Plan Usage", link: "/dashboard/employer/plan-usage", active: pathname === "/dashboard/employer/plan-usage" },
  ];

  const footerItems = [
    { icon: <FiSettings />, label: "Settings", link: "/dashboard/employer/settings", active: pathname === "/dashboard/employer/settings" },
    { icon: <FiHelpCircle />, label: "Help Center", link: "/dashboard/employer/help-center", active: pathname === "/dashboard/employer/help-center" },
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

      <ApplicationsProvider>
        <PostedJobsProvider>
          <ReceivedBidsProvider>
            <div className={`${styles.container}`}>
              {children}
            </div>
          </ReceivedBidsProvider>
        </PostedJobsProvider>
      </ApplicationsProvider>

      
    </div>
  );
} 