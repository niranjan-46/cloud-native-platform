"use client";

import Image from 'next/image';
import Link from 'next/link';
import { FaSearch, FaHandshake, FaFileAlt, FaChartLine, FaArrowRight } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section position-relative overflow-hidden">
        <div className="container">
          <div className="row align-items-center min-vh-100 py-5">
            <div className="col-lg-6 order-lg-1 order-2">
              <h1 className="display-4 fw-bold mb-4 animate-fade-in">
                Connect with Top Talent and Consultancies
              </h1>
              <p className="lead mb-4 animate-fade-in">
                Streamline your hiring process with HireLink. Post jobs, find candidates, and connect with trusted consultancies all in one place.
              </p>
              <div className="d-flex flex-wrap gap-3 animate-fade-in">
                <Link href="/register" className="btn btn-primary btn-lg d-flex align-items-center">
                  Get Started <FaArrowRight className="ms-2" />
                </Link>
                <Link href="/about" className="btn btn-outline-primary btn-lg">
                  Learn More
                </Link>
              </div>
              <div className="mt-4 d-flex flex-wrap gap-3 animate-fade-in">
                <div className="d-flex align-items-center">
                  <div className="trust-badge me-2">
                    <FaHandshake className="text-primary" />
                  </div>
                  <span>Trusted by 1000+ Companies</span>
                </div>
                <div className="d-flex align-items-center">
                  <div className="trust-badge me-2">
                    <FaChartLine className="text-primary" />
                  </div>
                  <span>95% Success Rate</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6 order-lg-2 order-1 mb-4 mb-lg-0">
              <div className="hero-image-container position-relative">
                <Image
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Team collaboration"
                  width={600}
                  height={400}
                  className="img-fluid rounded-4 shadow-lg animate-float"
                  priority
                />
                <div className="floating-card card-1">
                  <div className="d-flex align-items-center">
                    <div className="avatar me-2">
                      <Image
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&q=80"
                        alt="User"
                        width={40}
                        height={40}
                        className="rounded-circle"
                      />
                    </div>
                    <div>
                      <div className="fw-bold">Sarah Johnson</div>
                      <small className="text-muted">Hired 5 candidates</small>
                    </div>
                  </div>
                </div>
                <div className="floating-card card-2">
                  <div className="d-flex align-items-center">
                    <div className="avatar me-2">
                      <Image
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&q=80"
                        alt="User"
                        width={40}
                        height={40}
                        className="rounded-circle"
                      />
                    </div>
                    <div>
                      <div className="fw-bold">Mike Chen</div>
                      <small className="text-muted">Found perfect job</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Why Choose HireLink?</h2>
            <p className="lead text-muted">Discover the features that make us different</p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="feature-card text-center p-4 h-100">
                <div className="feature-icon mb-3">
                  <FaSearch size={40} className="text-primary" />
                </div>
                <h3 className="h4">Smart Search</h3>
                <p className="text-muted">Find the perfect candidates with our advanced search and filtering system.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-card text-center p-4 h-100">
                <div className="feature-icon mb-3">
                  <FaHandshake size={40} className="text-primary" />
                </div>
                <h3 className="h4">Trusted Partners</h3>
                <p className="text-muted">Connect with verified consultancies and streamline your hiring process.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-card text-center p-4 h-100">
                <div className="feature-icon mb-3">
                  <FaFileAlt size={40} className="text-primary" />
                </div>
                <h3 className="h4">CV Database</h3>
                <p className="text-muted">Access a vast database of qualified candidates ready to join your team.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-card text-center p-4 h-100">
                <div className="feature-icon mb-3">
                  <FaChartLine size={40} className="text-primary" />
                </div>
                <h3 className="h4">Analytics</h3>
                <p className="text-muted">Track your hiring metrics and make data-driven decisions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5 position-relative overflow-hidden">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="cta-image-container">
                <Image
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Business meeting"
                  width={500}
                  height={350}
                  className="img-fluid rounded-4 shadow-lg"
                />
                <div className="cta-stats mb-3">
                  <div className="stat-item">
                    <div className="stat-number">10k+</div>
                    <div className="stat-label">Active Jobs</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">5k+</div>
                    <div className="stat-label">Consultancies</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">50k+</div>
                    <div className="stat-label">Candidates</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <h2 className="display-5 fw-bold mb-4">Ready to Transform Your Hiring Process?</h2>
              <p className="lead mb-4">
                Join thousands of companies who have streamlined their hiring with HireLink. Get started today and find your perfect match.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link href="/register" className="btn btn-primary btn-lg">
                  Create Your Account
                </Link>
                <Link href="/contact" className="btn btn-outline-primary btn-lg">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
