"use client";

import Link from 'next/link';
import { FaLinkedin, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-4">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-3">
            <h5>HireLink</h5>
            <p>
              Connecting Employers with Consultancies for seamless hiring processes.
            </p>
          </div>
          <div className="col-md-2 mb-3">
            <h5>For Employers</h5>
            <ul className="list-unstyled">
              <li><Link href="/post-job">Post a Job</Link></li>
              <li><Link href="/cv-database">CV Database</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div className="col-md-2 mb-3">
            <h5>For Consultancies</h5>
            <ul className="list-unstyled">
              <li><Link href="/browse-jobs">Browse Jobs</Link></li>
              <li><Link href="/submit-cv">Submit CV</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          <div className="col-md-2 mb-3">
            <h5>Resources</h5>
            <ul className="list-unstyled">
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/help-center">Help Center</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div className="col-md-2 mb-3">
            <h5>Legal</h5>
            <ul className="list-unstyled">
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service">Terms of Service</Link></li>
              <li><Link href="/cookie-policy">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <hr className="my-4" />
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">
              © {new Date().getFullYear()} HireLink. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="social-links">
              <a href="#">
                <FaLinkedin size={20} />
              </a>
              <a href="#">
                <FaFacebook size={20} />
              </a>
              <a href="#">
                <FaTwitter size={20} />
              </a>
              <a href="#">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 
