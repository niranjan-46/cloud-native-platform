"use client";
import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // Import Bootstrap JS bundle
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
    
    // Import Bootstrap Icons CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css";
    document.head.appendChild(link);

    // Cleanup function
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return null;
}