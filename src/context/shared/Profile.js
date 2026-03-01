"use client";
import { createContext, useState } from 'react';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    user: {},
    profile: {},
    education: [],
    experience: []
  });
  return <ProfileContext.Provider value={{ profileData, setProfileData }}>{children}</ProfileContext.Provider>;
};