import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import BootstrapClient from './BootstrapClient';
import IsHome from '@/components/IsHome';
import LayoutWrapper from '@/components/LayoutWrapper';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Inter } from "next/font/google";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HireLink - Connect Employers with Consultancies",
  description: "A platform connecting Employers with Consultancies for hiring candidates. Post jobs, browse CVs, and streamline your hiring process.",
};

export default function RootLayout({ children }) {
  return (
    <GoogleOAuthProvider clientId="578224276104-sk0t3bvkn2qerllusiaibg6t0k348g31.apps.googleusercontent.com">
    <html lang="en">
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <LayoutWrapper>
          <IsHome />
          <main className="min-vh-100">
            {children}
          </main>
        </LayoutWrapper>
        <BootstrapClient />
      </body>
    </html>
    </GoogleOAuthProvider>
  );
}
