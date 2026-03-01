"use client";
import { createContext, useState } from 'react';

export const PlanContext = createContext();

export const PlanProvider = ({ children }) => {
  const [userSubscription, setUserSubscription] = useState(null);
  return <PlanContext.Provider value={{ userSubscription, setUserSubscription }}>{children}</PlanContext.Provider>;
};