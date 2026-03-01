"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaBuilding, FaHandshake, FaUserTie } from 'react-icons/fa';
import styles from './page.module.css';
import Cookies from 'js-cookie';


export default function Register() {
  const [showNoAccount, setShowNoAccount] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [googleRegUser, setGoogleRegUser] = useState(null);
  // const [registrationData, setRegistrationData] = useState(null);
  // const [isRegistrationData, setIsRegistrationData] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noAccount = params.get('no_account') === '1';
    setShowNoAccount(noAccount);

    const rawGoogleUser = Cookies.get('google_reg_user');
    if (noAccount && rawGoogleUser) {
      try {
        setGoogleRegUser(JSON.parse(rawGoogleUser));
      } catch {
        setGoogleRegUser(null);
      }
      // Clear after one-time use to avoid showing this message unexpectedly later.
      Cookies.remove('google_reg_user', { path: '/' });
      return;
    }

    // If this page is opened normally, ensure stale cookie is cleared.
    Cookies.remove('google_reg_user', { path: '/' });
    setGoogleRegUser(null);
  }, []);

  // useEffect(() => {
  //   const registrationData = JSON.parse(sessionStorage.getItem('registrationData'));
  //   if (registrationData) {
  //     setRegistrationData(registrationData);
  //     setIsRegistrationData(true);
  //     console.log("registrationData before removing from sessionStorage: ",registrationData);
  //     // sessionStorage.removeItem('registrationData'); // Clean up
  //     // console.log("registrationData after removing from sessionStorage: ",registrationData);
  //   }
  // }, []);

  return (
    <div className={`${styles.wrapper} register-page py-3 py-md-5`}>
      <div className="container px-3 px-sm-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8">
            <div className="text-center mb-4 mb-md-5 px-2">
              <h1 className="display-5 fw-bold mb-2">Create Your Account</h1>
              {googleRegUser ? 
              <h1 className={`${styles.responsiveaccountmessage}`}>
                No account found for{" "}
                <span className={`${styles.responsiveemail}`}>
                  {googleRegUser.email}
                </span>
              </h1> :
              <></>
              }
              <p className="lead text-muted mb-0">Choose your account type to get started</p>
            </div>

            <div className="row g-3 g-md-4 justify-content-center">
              {[
                {
                  type: 'employer',
                  icon: <FaBuilding size={32} className="text-primary" />,
                  title: "Employer",
                  desc: "Post jobs and find candidates",
                  features: [
                    "Post unlimited jobs",
                    "Access CV database",
                    "Manage applications"
                  ],
                  href: "/register/employer"
                },
                {
                  type: 'consultancy',
                  icon: <FaHandshake size={32} className="text-primary" />,
                  title: "Consultancy",
                  desc: "Bid on jobs and find clients",
                  features: [
                    "Bid on projects",
                    "Manage candidates",
                    "Track progress"
                  ],
                  href: "/register/consultancy"
                },
                {
                  type: 'candidate',
                  icon: <FaUserTie size={32} className="text-primary" />,
                  title: "Candidate",
                  desc: "Find jobs and get hired",
                  features: [
                    "Browse jobs",
                    "Upload CV",
                    "Track applications"
                  ],
                  href: "/register/candidate"
                }
              ].map((card) => (
                <div key={card.type} className="col-12 col-sm-6 col-lg-4">
                  <div 
                    className={`${styles.card} ${selectedType === card.type ? styles.selected : ''}`}
                    onClick={() => setSelectedType(card.type)}
                  >
                    <div className={styles.bg}>
                      <div className="icon-container mb-3">
                        {card.icon}
                      </div>
                      <h3 className="h5 mb-2">{card.title}</h3>
                      <p className="text-muted small mb-3">{card.desc}</p>
                      <ul className="list-unstyled text-start small mb-3">
                        {card.features.map((feature, i) => (
                          <li key={i} className="mb-1">✓ {feature}</li>
                        ))}
                      </ul>
                      <Link 
                        href={card.href} 
                        className={`${styles.btn} btn btn-sm ${
                          selectedType === card.type ? 'btn-primary' : 'btn-outline-primary'
                        } w-100 mt-auto`}
                      >
                        Continue as {card.title}
                      </Link>
                    </div>
                    <div className={styles.blob}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-3 mt-md-4 px-2">
              <p className="mb-0 small">
                Already have an account? <Link href="/login" className={`${styles.link} text-dark fw-bold text-decoration-none`}>Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
