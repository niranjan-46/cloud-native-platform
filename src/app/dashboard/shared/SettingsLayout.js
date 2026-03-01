"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiSettings, FiLock, FiFile, FiEdit2, FiUser, FiEye, 
  FiShield, FiKey, FiTrash2, FiFileText, FiHelpCircle,
  FiBell, FiMail, FiGlobe, FiCreditCard
} from 'react-icons/fi';
import { FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { BsCurrencyExchange } from 'react-icons/bs';
import { useRouter } from 'next/navigation';
import ChangePasswd from './changepasswd/ChangePasswd';
import DeleteAccountModal from './deleteaccount/DeleteAccountModel';
import EmailPreferencesModal from './emailpreferences/EmailPreferencesModal';
import Transaction from '@/components/employer/models/transaction/Transaction';
import Plans from '@/components/employer/models/plans/Plans';
import PaymentMethodsModal from '@/components/shared/PaymentMethodsModal';



const SettingsLayout = ({ userType='employer' }) => {
  const router = useRouter();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isEmailPreferencesModalOpen, setIsEmailPreferencesModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isPaymentMethodsModalOpen, setIsPaymentMethodsModalOpen] = useState(false);
  const currentPlanId = 7; // Replace with actual current plan ID from your user data
  const supportsBilling = userType === 'employer' || userType === 'consultancy';

  const settingsSections = [
    {
      title: "Account Settings",
      icon: FiSettings,
      items: [
        { icon: FiEdit2, label: "Edit Profile", onClick: () => {router.push('/dashboard/'+userType+'/my-profile')}},
        { icon: FiUser, label: "Change Profile Picture", onClick: () => {router.push('/dashboard/'+userType+'/my-profile')}},
        { icon: FiEye, label: "Appearance", onClick: () => {router.push('/dashboard/'+userType+'/my-profile')}},
        { icon: FiBell, label: "Notifications", onClick: () => {router.push('/dashboard/'+userType+'/my-profile')}},
        { icon: FiMail, label: "Email Preferences", onClick: () => setIsEmailPreferencesModalOpen(true) },
      ]
    },
    {
      title: "Privacy & Security",
      icon: FiLock,
      items: [
        { icon: FiShield, label: "Two-Factor Authentication", onClick: () => {} },
        { icon: FiKey, label: "Modify Password", onClick: () => setIsPasswordModalOpen(true) },
        { icon: FiGlobe, label: "Privacy Settings", onClick: () => {} },
        { icon: FiTrash2, label: "Delete Account", onClick: () => setIsDeleteAccountModalOpen(true), isDanger: true },
      ]
    },
    {
      title: "Billing & Subscription",
      icon: FiCreditCard,
      items: [
        { icon: FiCreditCard, label: "Payment Methods", onClick: () => setIsPaymentMethodsModalOpen(true) },
        {
          icon: BsCurrencyExchange,
          label: "Billing History",
          onClick: () => (supportsBilling ? setIsTransactionModalOpen(true) : setIsPaymentMethodsModalOpen(true))
        },
        {
          icon: FaCreditCard,
          label: "Subscription Plans",
          onClick: () => (supportsBilling ? setIsPlansModalOpen(true) : setIsPaymentMethodsModalOpen(true))
        },
      ]
    },
    {
      title: "Legal",
      icon: FiFile,
      items: [
        { icon: FiFileText, label: "Terms and Conditions", onClick: () => {
          router.push('/dashboard/'+userType+'/settings/terms');
        } },
        { icon: FiFileText, label: "Privacy Policy", onClick: () => {
          router.push('/dashboard/'+userType+'/settings/privacy');
        } },
        { icon: FiHelpCircle, label: "Help Center", onClick: () => {
          router.push('/dashboard/'+userType+'/help-center');
        } },
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  const buttonVariants = {
    hover: {
      x: 4,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98
    }
  };

  return (
    <>
      <motion.div 
        className="dashboard-container"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className="dashboard-card p-4 mb-4" variants={sectionVariants}>
          <h1 className="h3 mb-3">Settings</h1>
          <p className="text-muted mb-0">Manage your account settings and preferences</p>
        </motion.div>

        <div className="row g-4">
          {settingsSections.map((section, index) => (
            <motion.div 
              key={index} 
              className="col-md-6"
              variants={sectionVariants}
            >
              <div className="dashboard-card p-4 h-100">
                <div className="d-flex align-items-center mb-4">
                  <section.icon className="fs-4 me-2" style={{ color: 'var(--primary-color)' }} />
                  <h2 className="h5 mb-0">{section.title}</h2>
                </div>
                
                <div className="d-grid gap-2">
                  {section.items.map((item, itemIndex) => (
                    <motion.button
                      key={itemIndex}
                      className={`dashboard-button d-flex align-items-center gap-2 ${
                        item.isDanger ? 'text-danger' : 'text-secondary'
                      }`}
                      onClick={item.onClick}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <item.icon className="fs-5" />
                      <span>{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <ChangePasswd 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
      <DeleteAccountModal 
        isOpen={isDeleteAccountModalOpen} 
        onClose={() => setIsDeleteAccountModalOpen(false)} 
      />
      <EmailPreferencesModal 
        isOpen={isEmailPreferencesModalOpen} 
        onClose={() => setIsEmailPreferencesModalOpen(false)} 
      />
      <Transaction
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />
      <Plans 
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        userType={userType}
        currentPlanId={currentPlanId}
      />
      <PaymentMethodsModal
        isOpen={isPaymentMethodsModalOpen}
        onClose={() => setIsPaymentMethodsModalOpen(false)}
        userType={userType}
      />
    </>
  );
};

export default SettingsLayout;
