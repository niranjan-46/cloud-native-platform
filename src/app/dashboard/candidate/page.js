"use client";

import styles from "./page.module.css";
import { Card } from "react-bootstrap";
import { motion } from "framer-motion";
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar } from 'react-icons/fi';
import Image from 'next/image';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Cookies from 'js-cookie';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import ClipLoader from 'react-spinners/ClipLoader';
import { useRouter } from 'next/navigation';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState({});
  const [myapplications, setMyapplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState([]);

  const fetchdata = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/me/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      // Fetch applications data
      const applicationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!applicationsResponse.ok) {
        throw new Error('Failed to fetch applications data');
      }

      const userData = await userResponse.json();
      const appData = await applicationsResponse.json();
      const applicationsData = [];
      appData.forEach(function(application, index) {
        if(index+1 <= 4 ){
          applicationsData.push(application);
        }
        else{
          return;
        }
      });

      // Fetch job details for all applications at once
      const jobsWithApplications = await Promise.all(
        applicationsData.map(async (application) => {
          const jobResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${application?.job}/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Cookies.get('access_token')}`
            }
          });
          const jobData = await jobResponse.json();
          return { job: jobData, app: application };
        })
      );

      // Remove duplicates by job ID
      const uniqueJobs = jobsWithApplications.reduce((acc, current) => {
        const x = acc.find(item => item.job.id === current.job.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      // Sort by most recent first
      const sortedJobs = uniqueJobs.sort((a, b) => 
        new Date(b.app.created_at) - new Date(a.app.created_at)
      );

      // Get only the 5 most recent jobs
      const mostRecentJobs = sortedJobs.slice(0, 5);

      setUserData(userData);
      setMyapplications(applicationsData);
      setRecentJobs(mostRecentJobs);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchdata();
  }, []);

  // Calculate stats from actual data
  const getStats = () => {
    const applied = myapplications.length;
    const rejected = myapplications.filter(app => app?.status === 'rejected').length;
    const pending = myapplications.filter(app => app?.status === 'pending').length;
    const scheduled = myapplications.filter(app => app?.status === 'scheduled').length;

    // Get unique companies for the "Applied Jobs" stat
    const uniqueCompanies = [...new Set(myapplications.map(app => app?.job))];
    const sampleCompanies = uniqueCompanies?.slice(0, 3).map(jobId => {
      const app = myapplications.find(a => a?.job === jobId);
      const job = recentJobs.find(j => j.job.id === jobId)?.job;
      return {
        name: job?.company_name || 'Unknown Company',
        logo: job?.company_logo || '/Dashboards/default_company.svg'
      };
    }).filter(company => company); // Filter out undefined entries

    return [
      { 
        label: "Applied Jobs", 
        value: applied, 
        color: "#2BA4FA", 
        bgColor: "#f0f9ff", 
        bgColorDark: "#bae6fd",
        icon: <FiCheckCircle size={24} />,
        companies: sampleCompanies
      },
      { 
        label: "Rejected", 
        value: rejected, 
        color: "#e53e3e", 
        bgColor: "#fff5f5", 
        bgColorDark: "#fed7d7",
        icon: <FiXCircle size={24} />
      },
      { 
        label: "Pending", 
        value: pending, 
        color: "#FFD166", 
        bgColor: "#ebf8ff", 
        bgColorDark: "#FFD166",
        icon: <FiClock size={24} />
      },
      { 
        label: "Scheduled", 
        value: scheduled, 
        color: "#48bb78", 
        bgColor: "#f0fff4", 
        bgColorDark: "#c6f6d5",
        icon: <FiCalendar size={24} />
      }
    ];
  };

  // Rest of your component remains the same...
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

  const chartData = useMemo(() => {
    const rejected = myapplications.filter(app => app.status === 'rejected').length;
    const pending = myapplications.filter(app => app.status === 'pending').length;
    const scheduled = myapplications.filter(app => app.status === 'scheduled').length;

    return {
      labels: ['Rejected', 'Pending', 'Scheduled'],
      datasets: [
        {
          data: [rejected, pending, scheduled],
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
  }, [myapplications]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <ClipLoader color="#0d6efd" size={50} />
          <p className="mt-3 text-black">Fetching content, please wait...</p>
        </div>
      </div>
    );
  }

  function dateFormatter(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  return (
    <>
      <div className="row">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.header}
        >
          <h2>Hello {userData.name}</h2>
          <p>Let&apos;s find a good fitted job here</p>
        </motion.div>

        <div className="d-flex flex-wrap gap-3 mt-4">
          {getStats().map((stat, idx) => (
            <motion.div
              key={idx}
              className={styles.statCard}
              style={{
                '--bg-color': stat.bgColor,
                '--bg-color-dark': stat.bgColorDark,
                '--color': stat.color,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * idx }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                {stat.icon}
                <h3>{stat.value}</h3>
              </div>
              <p>{stat.label}</p>
              {stat?.companies && (
                <div className={styles.companyLogos}>
                  {stat.companies.map((company, i) => (
                    <div key={i} className={styles.companyLogoWrapper} title={company?.name}>
                      <Image
                        src={company?.logo}
                        alt={company?.name}
                        width={24}
                        height={24}
                        className={styles.companyLogo}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="row w-100 mt-5 g-4">
        <div className="col-md-6">
          <Card className={styles.analyticsCard}>
            <Card.Body>
              <h5>Analytics</h5>
              <div className={styles.donutChart}>
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-12 col-md-6 mb-4">
          <Card className={`${styles.recentCard} h-100`}>
            <Card.Body>
              <h5 className="mb-3">Recently Applied</h5>
              <div className={styles.recentTable}>
                {recentJobs?.map((item, i) => (
                  <motion.div
                    key={i}
                    className={`${styles.recentRow} d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * i }}
                  >
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                      <div className={styles.companyLogoWrapper}>
                        <Image
                          src={item?.job?.company_logo || '/Dashboards/default_company.svg'}
                          alt={item?.job?.company_name}
                          width={32}
                          height={32}
                          className={styles.companyLogo}
                        />
                      </div>
                      <div>
                        <h6 className="mb-0">{item?.job?.company_name}</h6>
                        <small className="text-muted">{item?.job?.title}</small>
                      </div>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block me-2 mb-1">{dateFormatter(item?.app?.created_at)}</small>
                      <span
                        className={
                          item?.app?.status === "rejected"
                            ? styles.rejected
                            : item?.app?.status === "pending"
                            ? styles.pending
                            : styles.scheduled
                        }
                      >
                        {item?.app?.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                className={`${styles.viewall} btn btn-primary border-0 text-center rounded-5 w-100 mt-3`}
                onClick={() => router.push('/dashboard/candidate/my-applications')}
              >
                View All
              </button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
}