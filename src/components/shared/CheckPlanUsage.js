'use client';
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios';
import Cookies from 'js-cookie';
import { PlanContext } from '@/context/shared/Plan';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';



const CheckPlanUsage = ({type='job'}) => {
  const {userSubscription, setUserSubscription} = useContext(PlanContext);

    useEffect(() => {
        const fetchUserSubscription = async () => {
          try {
            const response = await axios.get(
              `${API_URL}/api/subscribe/`,
              {
                headers: {
                  'Authorization': `Bearer ${Cookies.get('access_token')}`
                }
              }
            );
            if (response.data.has_subscription) {
              setUserSubscription(response.data);
            } else {
              setUserSubscription(null);
            }
          } catch (error) {
            console.error('Error fetching subscription:', error);
            setUserSubscription(null);
          }
        };
        fetchUserSubscription();
      }, []);
      if (userSubscription) {
        return (type === 'job' ? parseInt(userSubscription?.job_limit) !== 0 : parseInt(userSubscription?.bid_limit) !== 0);
      }
      return false;
}

export default CheckPlanUsage;
