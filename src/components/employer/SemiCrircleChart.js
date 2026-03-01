import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaPlay, FaUsers, FaCalendarCheck, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import Link from 'next/link';
import styles from './SemiCrircleChart.module.css';




ChartJS.register(ArcElement, Tooltip, Legend);

const ApplicantDistributionChart = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [stats, setStats] = useState({
    interview: 0,
    shortlisted: 0,
    rejected: 0,
    applied: 0
  });

  const [data, setData] = useState({
    labels: ['Interview', 'Shortlisted', 'Rejected', 'Applied'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#36a2eb', '#ffce56', '#ff6384', '#4bc0c0'],
        borderWidth: 0,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        });
        const applications = await response.json();
        
        // Calculate stats
        const newStats = {
          interview: 0,
          shortlisted: 0,
          rejected: 0,
          applied: 0
        };

        applications.forEach(app => {
          if (app.status in newStats) {
            newStats[app.status]++;
          }
        });

        setStats(newStats);
        
        // Update chart data
        setData(prevData => ({
          ...prevData,
          datasets: [{
            ...prevData.datasets[0],
            data: [
              newStats.interview,
              newStats.shortlisted,
              newStats.rejected,
              newStats.applied
            ]
          }]
        }));

        setIsLoading(false);
      } catch (error) {
        setError(error);
        toast.error('Failed to fetch applications');
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const options = {
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value = context.raw;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <ClipLoader color="#0d6efd" size={50} />
          <p className="mt-3 text-black">Fetching content, please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-red-600 text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const totalApplications = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="container-fluid bg-white">
      <div className="row shadow-sm border p-4">
        <div className="col">
          <div className="card border-0 text-center">
            <h5 className="card-title mb-4"><FaUsers /> Application Status Distribution</h5>
            <div className="d-flex justify-content-center" style={{ height: '350px' }}>
              <Doughnut data={data} options={options} />
            </div>
          </div>
        </div>

        <div className="col">
          <ul className="list-unstyled">
            <Link className="text-decoration-none text-black" href="/dashboard/employer/applicants">
            <li className={`${styles.li} mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded`}>
              <span className="fw-semibold"> <FaCalendarCheck /> Interview</span>
              <span className="d-flex align-items-center">
                {stats.interview}
                <FaPlay className="ms-2" size={14} />
              </span>
            </li>
            <li className={`${styles.li} mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-warning bg-opacity-10`}>
              <span className="fw-semibold"> <FaCheckCircle /> Shortlisted</span>
              <span className="d-flex align-items-center">
                {stats.shortlisted}
                <FaPlay className="ms-2" size={14} />
              </span>
            </li>
            <li className={`${styles.li} mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-danger bg-opacity-10`}>
              <span className="fw-semibold"> <FaTimesCircle /> Rejected</span>
              <span className="d-flex align-items-center">
                {stats.rejected}
                <FaPlay className="ms-2" size={14} />
              </span>
            </li>
            <li className={`${styles.li} mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-info bg-opacity-10`}>
              <span className="fw-semibold"> <FaHourglassHalf /> Applied</span>
              <span className="d-flex align-items-center">
                {stats.applied}
                <FaPlay className="ms-2" size={14} />
              </span>
            </li>
            <li className={`${styles.li} mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-secondary bg-opacity-10`}>
              <span className="fw-semibold"> <FaUsers /> Total Applications</span>
              <span className="d-flex align-items-center">
                {totalApplications}
                <FaPlay className="ms-2" size={14} />
              </span>
            </li>
            </Link>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDistributionChart;