"use client";
import { createContext, useState } from 'react';

export const PostedJobsContext = createContext();

export const PostedJobsProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  return <PostedJobsContext.Provider value={{ jobs, setJobs }}>{children}</PostedJobsContext.Provider>;
};