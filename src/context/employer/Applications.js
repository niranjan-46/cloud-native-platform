"use client";
import { createContext, useState } from 'react';

export const ApplicationsContext = createContext();

export const ApplicationsProvider = ({ children }) => {
  const [applications, setApplications] = useState([]);
  return <ApplicationsContext.Provider value={{ applications, setApplications }}>{children}</ApplicationsContext.Provider>;
};