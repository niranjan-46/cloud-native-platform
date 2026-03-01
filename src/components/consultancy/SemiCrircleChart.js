import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaHandshake } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import Link from 'next/link';


ChartJS.register(ArcElement, Tooltip, Legend);

const ConsultancyBidAnalytics = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  });

  const [data, setData] = useState({
    labels: ['Pending', 'Approved', 'Rejected', 'Completed'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#ffce56', '#4bc0c0', '#ff6384', '#36a2eb'],
        borderWidth: 0,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bids/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch bids');
        }
        
        const bids = await response.json();
        
        // Calculate stats
        const newStats = {
          pending: 0,
          approved: 0,
          rejected: 0,
          completed: 0
        };

        bids.forEach(bid => {
          if (bid.status in newStats) {
            newStats[bid.status]++;
          }
        });

        setStats(newStats);
        
        // Update chart data
        setData(prevData => ({
          ...prevData,
          datasets: [{
            ...prevData.datasets[0],
            data: [
              newStats.pending,
              newStats.approved,
              newStats.rejected,
              newStats.completed
            ]
          }]
        }));

        setIsLoading(false);
      } catch (error) {
        setError(error.message);
        toast.error('Failed to fetch bid analytics');
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
          <p className="mt-3 text-black">Fetching bid analytics, please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-red-600 text-xl font-semibold mb-2">Error Loading Analytics</h2>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalBids = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="container-fluid bg-white">
      <div className="row shadow-sm border p-4">
        <div className="col">
          <div className="card border-0 text-center">
            <h5 className="card-title mb-4"><FaFileAlt /> Bid Status Distribution</h5>
            <div className="d-flex justify-content-center" style={{ height: '350px' }}>
              <Doughnut data={data} options={options} />
            </div>
          </div>
        </div>

        <div className="col">
          <Link className="text-decoration-none text-black" href="/dashboard/consultancy/your-bids">
          <ul className="list-unstyled">
            <li className="mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-warning bg-opacity-10">
              <span className="fw-semibold"> <FaHourglassHalf /> Pending</span>
              <span className="d-flex align-items-center">
                {stats.pending}
                <FaFileAlt className="ms-2" size={14} />
              </span>
            </li>
            <li className="mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-success bg-opacity-10">
              <span className="fw-semibold"> <FaCheckCircle /> Approved</span>
              <span className="d-flex align-items-center">
                {stats.approved}
                <FaFileAlt className="ms-2" size={14} />
              </span>
            </li>
            <li className="mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-danger bg-opacity-10">
              <span className="fw-semibold"> <FaTimesCircle /> Rejected</span>
              <span className="d-flex align-items-center">
                {stats.rejected}
                <FaFileAlt className="ms-2" size={14} />
              </span>
            </li>
            <li className="mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-primary bg-opacity-10">
              <span className="fw-semibold"> <FaHandshake /> Completed</span>
              <span className="d-flex align-items-center">
                {stats.completed}
                <FaFileAlt className="ms-2" size={14} />
              </span>
            </li>
            <li className="mb-3 d-flex justify-content-between align-items-center py-2 px-3 border rounded bg-secondary bg-opacity-10">
              <span className="fw-semibold"> <FaFileAlt /> Total Bids</span>
              <span className="d-flex align-items-center">
                {totalBids}
                <FaFileAlt className="ms-2" size={14} />
              </span>
            </li>
          </ul>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConsultancyBidAnalytics;