"use client";

import React from 'react';
import { motion } from 'framer-motion';
import styles from './page.module.css';

const TermsAndConditions = () => {
  const termsData = {
    lastUpdated: "January 1, 2023",
    companyName: "ExampleCorp",
    website: "www.example.com",
    points: [
      {
        title: "Acceptance of Terms",
        content: "By accessing and using this website, you accept and agree to be bound by the terms and provisions of this agreement."
      },
      {
        title: "User Responsibilities",
        content: "You agree not to use the website for any unlawful purpose or in any way that might harm, damage, or disparage any other party."
      },
      {
        title: "Intellectual Property",
        content: "All content included on this site, such as text, graphics, logos, button icons, images, and software, is the property of ExampleCorp or its content suppliers."
      },
      {
        title: "Limitation of Liability",
        content: "ExampleCorp shall not be liable for any special or consequential damages that result from the use of, or the inability to use, the materials on this site."
      },
      {
        title: "Modifications",
        content: "ExampleCorp reserves the right to modify these terms at any time. Your continued use of the website following such changes constitutes your acceptance of the new terms."
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
        <h1 className="h3 mb-3">Terms and Conditions</h1>
        <p className="text-muted mb-4">Last updated: {termsData.lastUpdated}</p>
        
        <div className="mb-4">
          <p className="lead">
            Welcome to {termsData.companyName}&apos;s website ({termsData.website}). 
            These terms and conditions outline the rules and regulations for the use of our website.
          </p>
        </div>
      </motion.div>
      
      <div className="row g-4">
        {termsData.points.map((term, index) => (
          <motion.div 
            key={index} 
            className="col-md-6"
            variants={itemVariants}
          >
            <div className="dashboard-card p-4 h-100">
              <h2 className="h5 mb-3">{term.title}</h2>
              <p className="text-secondary mb-0">{term.content}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div className="dashboard-card p-4 mt-4" variants={itemVariants}>
        <h2 className="h4 mb-3">Contact Us</h2>
        <p className="text-secondary mb-0">
          If you have any questions about these Terms and Conditions, please contact us at{" "}
          <a href="mailto:niranjanannavarapu@gmail.com">niranjanannavarapu@gmail.com</a>.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default TermsAndConditions;
