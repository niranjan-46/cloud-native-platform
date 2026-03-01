"use client";
import { createContext, useState } from 'react';

export const ReceivedBidsContext = createContext();

export const ReceivedBidsProvider = ({ children }) => {
  const [bids, setBids] = useState([]);
  return <ReceivedBidsContext.Provider value={{ bids, setBids }}>{children}</ReceivedBidsContext.Provider>;
};