"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from './DashboardSidebar.module.css';
import { logout } from '@/utils/logout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardSidebar({ 
  isMobile, 
  showSidebar, 
  menuItems, 
  footerItems,
  onCloseSidebar,
  profileData
}) {
  const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };
const router = useRouter();

  const handleLinkClick = () => {
    if (isMobile && onCloseSidebar) {
      onCloseSidebar();
    }
  };
  console.log("profileData 1: ",profileData)

  return (
    <motion.div
      className={`${styles.sidebar} ${isMobile ? styles.sidebarMobile : ''} ${showSidebar ? styles.show : ''} vh-100`}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={sidebarVariants}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.sidebarContent}>
        {!isMobile && <h4 className="mb-4" style={{ color: '#000000' }}>Zyukthi</h4>}
        <ul className="list-unstyled">
          {menuItems.map((item, index) => (
            <Link href={`${item.link}`} className='text-decoration-none' key={index} onClick={handleLinkClick}>
            <li key={index} className={item.active ? styles.active : ''}>
              {item.icon}
              <span>{item.label}</span>
            </li>
            </Link>
          ))}
        </ul>
      </div>
      
      <div className={styles.sidebarFooter}>
        <ul className="list-unstyled">
          {footerItems.map((item, index) => {
            if (item.label === "Log Out") {
              return (
                <li key={index}
                  onClick={()=>{
                    handleLinkClick();
                    logout(router);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </li>
              );
            }

            return (
              <Link href={`${item.link}`} className='text-decoration-none' key={index} onClick={handleLinkClick}>
              <li key={index} className={item.active ? styles.active : ''}>
                {item.icon}
                <span>{item.label}</span>
              </li>
              </Link>
            );
          })}
        </ul>
        <Link href="/dashboard/employer/my-profile" className='text-decoration-none text-dark' onClick={handleLinkClick}>
        <div className={`${styles.userProfile} ${isMobile ? 'mb-5' : 'mb-3'}`} >
          <Image 
            src={profileData.profile.profile_image || `https://robohash.org/${profileData.user.name}.png?set=set3`} 
            alt="Profile" 
            className={`${styles.avatar} bg-white`}
            width={45}
            height={45}
          />
          <div>
            <p className="mb-0">{profileData.user.name}</p>
            <small>{profileData.user.email}</small>
          </div>
        </div>
        </Link>
      </div>
    </motion.div>
  );
} 