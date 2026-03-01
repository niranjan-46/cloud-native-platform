"use client";

import React from 'react';
import { motion } from 'framer-motion';
import styles from './page.module.css';

const PrivacyPolicy = () => {
  const privacyData = {
    lastUpdated: "January 1, 2023",
    companyName: "ExampleCorp",
    website: "www.example.com",
    points: [
      {
        title: "Information We Collect",
        content: "We collect personal information such as name, email address, and contact details when you register on our site or fill out a form."
      },
      {
        title: "How We Use Your Information",
        content: "We may use the information we collect to personalize your experience, improve our website, process transactions, or send periodic emails."
      },
      {
        title: "Cookies",
        content: "We use cookies to enhance your experience, gather general visitor information, and track visits to our website."
      },
      {
        title: "Third-Party Disclosure",
        content: "We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties unless we provide users with advance notice."
      },
      {
        title: "Data Security",
        content: "We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information."
      },
      {
        title: "Children's Online Privacy Protection",
        content: "We comply with COPPA and do not knowingly collect any information from anyone under 13 years of age."
      }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <motion.div 
      className="dashboard-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="dashboard-card p-4 mb-4" variants={itemVariants}>
        <h1 className="h3 mb-3">Privacy Policy</h1>
        <p className="text-muted mb-4">Last updated: {privacyData.lastUpdated}</p>
        
        <div className="mb-4">
          <p className="lead">
            This Privacy Policy describes how {privacyData.companyName} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) 
            collects, uses, and shares your personal information when you use our website ({privacyData.website}).
          </p>
        </div>
      </motion.div>
      
      <div className="row g-4">
        {privacyData.points.map((policy, index) => (
          <motion.div 
            key={index} 
            className="col-md-6"
            variants={itemVariants}
          >
            <div className="dashboard-card p-4 h-100">
              <h2 className="h5 mb-3">{policy.title}</h2>
              <p className="text-secondary mb-0">{policy.content}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div className="dashboard-card p-4 mt-4" variants={itemVariants}>
        <h2 className="h4 mb-3">Changes to This Privacy Policy</h2>
        <p className="text-secondary">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </p>
      </motion.div>
      
      <motion.div className="dashboard-card p-4 mt-4" variants={itemVariants}>
        <h2 className="h4 mb-3">Contact Us</h2>
        <p className="text-secondary mb-0">
          If you have any questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:niranjanannavarapu@gmail.com">niranjanannavarapu@gmail.com</a>.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicy;
