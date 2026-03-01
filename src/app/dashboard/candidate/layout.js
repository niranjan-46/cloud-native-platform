"use client";

import styles from "./page.module.css";
import { useEffect, useState, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import { FiHome, FiBriefcase, FiBookmark, FiSearch, FiFileText, FiUser, FiSettings, FiHelpCircle, FiLogOut, FiCheckCircle, FiXCircle, FiClock, FiCalendar } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import TopNavbar from "@/components/TopNavbar";
import DashboardSidebar from "@/components/DashboardSidebar";
import { usePathname } from "next/navigation";
import Cookies from 'js-cookie';
import { ProfileContext } from "@/context/shared/Profile";



ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardLayout({ children }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { profileData, setProfileData } = useContext(ProfileContext);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const stats = [
    { 
      label: "Applied Jobs", 
      value: 250, 
      color: "#2BA4FA", 
      bgColor: "#f0f9ff", 
      bgColorDark: "#bae6fd",
      icon: <FiCheckCircle size={24} />,
      companies: [
        { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png" },
        { name: "Canon", logo: "https://1000logos.net/wp-content/uploads/2016/10/Canon-logo.jpg" },
        { name: "Razer", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTR0CL18TsZPEpYmfVwb1_SR7ePvkCDmqrXOQ&s" }
      ]
    },
    { 
      label: "Rejected", 
      value: 105, 
      color: "#e53e3e", 
      bgColor: "#fff5f5", 
      bgColorDark: "#fed7d7",
      icon: <FiXCircle size={24} />
    },
    { 
      label: "Pending", 
      value: 40, 
      color: "#FFD166", 
      bgColor: "#ebf8ff", 
      bgColorDark: "#FFD166",
      icon: <FiClock size={24} />
    },
    { 
      label: "Scheduled", 
      value: 30, 
      color: "#48bb78", 
      bgColor: "#f0fff4", 
      bgColorDark: "#c6f6d5",
      icon: <FiCalendar size={24} />
    }
  ];



  const pathname = usePathname();
  
  const menuItems = [
    { icon: <FiHome />, label: "Dashboard", link: "/dashboard/candidate", active: pathname === "/dashboard/candidate" },
    { icon: <FiBriefcase />, label: "Jobs", link: "/dashboard/candidate/jobs", active: pathname === "/dashboard/candidate/jobs" },
    { icon: <FiBookmark />, label: "Saved", link: "/dashboard/candidate/saved-jobs", active: pathname === "/dashboard/candidate/saved-jobs" },
    { icon: <FiSearch />, label: "Find Jobs", link: "/dashboard/candidate/find-jobs", active: pathname === "/dashboard/candidate/find-jobs" },
    { icon: <FiFileText />, label: "My Applications", link: "/dashboard/candidate/my-applications", active: pathname === "/dashboard/candidate/my-applications" },
    { icon: <FiUser />, label: "My Profile", link: "/dashboard/candidate/my-profile", active: pathname === "/dashboard/candidate/my-profile" },
  ];

  const footerItems = [
    { icon: <FiSettings />, label: "Settings", link: "/dashboard/candidate/settings", active: pathname === "/dashboard/candidate/settings" },
    { icon: <FiHelpCircle />, label: "Help Center", link: "/dashboard/candidate/help-center", active: pathname === "/dashboard/candidate/help-center" },
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

  // Chart data
  const chartData = {
    labels: ['Rejected', 'Pending', 'Scheduled'],
    datasets: [
      {
        data: [105, 40, 30],
        backgroundColor: [
          '#e53e3e',
          '#FFC107',
          '#48bb78',
        ],
        borderColor: [
          '#c53030',
          '#FFD166',
          '#38a169',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%',
  };

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
            onCloseSidebar={() => {
              setShowSidebar(false);
              document.body.style.overflow = 'auto';
            }}
            profileData={profileData}
          />
        )}
      </AnimatePresence>

      <div className={`${styles.container}`}>
        {children}
      </div>

      
    </div>
  );
} 