'use client';
import { FiMail, FiBell, FiMapPin } from 'react-icons/fi';
import { MdMessage } from 'react-icons/md';
import { HiOutlineMail, HiOutlineUserCircle } from 'react-icons/hi';
import styles from './page.module.css';
import SemiCircleChart from '@/components/consultancy/SemiCrircleChart';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


async function getUser() {
  try{
  const user = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/profile/`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('access_token')}`
      }
    }
  );
  const data = await user.json();
  return data;
} catch (error) {
  console.error('Error fetching user:', error);
  toast.error('Failed to fetch user profile');
  return null;
}
}

export default function EmployerDashboard() {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        userData.stats = {
          messages: 0,
          notifications: 0,
          applications: 0
        };
        setUser(userData);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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

  return (
    <div className={styles.dashboard}>
      {/* Header Section */}
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 mb-0 fw-bold">Dashboard</h1>
        <div className="d-flex gap-3">
          <button className="btn btn-light position-relative p-2">
            <HiOutlineMail size={24} />
            {user.stats.messages > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {user.stats.messages}
              </span>
            )}
          </button>
          <button className="btn btn-light position-relative p-2">
            <FiBell size={22} />
            {user.stats.notifications > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {user.stats.notifications}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Welcome Card */}
      <div className="card shadow-sm mb-4">
        <div className="container-fluid card-body">
          <div className="row justify-content-between align-items-center">
            {/* Left Column - User Info (will take available space) */}
            <div className="col-md-auto mb-3 mb-md-0">
              <h2 className="h5 card-title">Welcome back, {user?.user?.name}!</h2>
              <p className="card-text text-muted mb-2">{user?.profile?.specialization}</p>
              <div className="d-flex align-items-center gap-2">
                <FiMail size={16} className="text-muted" />
                <small className="text-muted">{user?.user?.email}</small>
              </div>
            </div>
            
            {/* Right Column - Profile Image (fixed width, aligned to end) */}
            <div className={`col-md-auto ${styles.profile}`}>
              <div className="d-flex flex-column align-items-center">
                <Image 
                  width={80} 
                  height={80} 
                  src={user?.profile?.profile_image || 'https://www.svgrepo.com/show/530589/company.svg'} 
                  alt={user?.profile?.consultancy_name} 
                  className="rounded-circle object-fit-cover border"
                  style={{ width: '80px', height: '80px' }}
                />
                <div className="mt-2 text-center">
                  <p className="mb-0 fw-medium">{user?.profile?.consultancy_name}</p>
                  <small className="text-muted">
                    <FiMapPin size={14} className="me-1" />
                    {(user?.profile?.office_address)?.substring(0, 10)}...
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card shadow-sm">
        <div className="card-body">
          <SemiCircleChart />
        </div>
      </div>
    </div>
  );
}