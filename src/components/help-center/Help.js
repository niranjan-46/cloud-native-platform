'use client';
import styles from './page.module.css';
import { useState, useRef, useCallback, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import ClipLoader from 'react-spinners/ClipLoader';
import Image from 'next/image';
import { TicketContext } from '@/context/help-center/Ticket';




export default function HelpCenter({queys}) {
  const [openQuestion, setOpenQuestion] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { tickets, setTickets } = useContext(TicketContext);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    screenshots: []
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const faqData = queys || []; 

  const filteredFaqs = faqData.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleQuestion = (id) => {
    setOpenQuestion(openQuestion === id ? null : id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [formData.screenshots]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files);
    
    // Validate each file
    const validFiles = newFiles.filter(file => {
      // Check if file is an image (all image formats)
      if (!file.type.match('image.*')) {
        toast.error(`File ${file.name} is not an image`);
        return false;
      }
      
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    if (validFiles.length + formData.screenshots.length > 5) {
      toast.error('You can only upload up to 5 screenshots in total');
      return;
    }

    setFormData(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, ...validFiles]
    }));
  };

  const removeScreenshot = (index) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append('subject', formData.subject);
    formDataToSend.append('message', formData.message);
    
    formData.screenshots.forEach((screenshot, index) => {
      formDataToSend.append(`screenshot${index + 1}`, screenshot);
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/help-support/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: formDataToSend,
        credentials: 'include'
      });

      if (response.ok) {
        setLoading(false);
        const data = await response.json();
        setTickets([...tickets, data]);
        toast.success('Your ticket has been created successfully!');
        setFormData({
          subject: '',
          message: '',
          screenshots: []
        });
        setShowContactForm(false);
      } else {
        setLoading(false);
        const errorData = await response.json();
        toast.error(`Failed to send message: ${errorData.message || 'Please try again.'}`);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error sending message:', error);
      toast.error('An error occurred. Please try again later.');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/help-support/`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        toast.error('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('An error occurred while fetching tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'open':
        return '#28a745';
      case 'closed':
        return '#dc3545';
      case 'in_progress':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="container py-5">
      <div className={styles.helpCenterHeader}>
        <h1>Frequently Asked</h1>
        <h1 className={styles.questionsText}>Questions</h1>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onFocus={()=> setSearchQuery('')}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <p className="text-muted mt-4">Still have a question in mind?</p>
        <button 
          className={`${styles.contactButton} mt-3`}
          onClick={() => setShowContactForm(true)}
        >
          Contact Us
        </button>
      </div>

      {/* Tickets Section */}
      <div className={`${searchQuery ? 'd-none' : ''} ${styles.ticketsSection}`}>
        <h2 className={styles.ticketsTitle}>Your Support Tickets</h2>
        {ticketsLoading ? (
          <div className={styles.loadingContainer}>
            <ClipLoader color="#0d6efd" size={30} />
            <p>Loading tickets...</p>
          </div>
        ) : tickets.length > 0 ? (
          <div className={styles.ticketsGrid}>
            {tickets.map((ticket) => (
              <div key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketHeader}>
                  <h3>{ticket.subject}</h3>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                  >
                    {ticket.status}
                  </span>
                </div>
                <p className={styles.ticketMessage}>{ticket.message}</p>
                <div className={styles.ticketScreenshots}>
                  {[ticket.screenshot1, ticket.screenshot2, ticket.screenshot3, ticket.screenshot4, ticket.screenshot5]
                    .filter(Boolean)
                    .map((screenshot, index) => (
                      <div key={index} className={styles.screenshotThumbnail}>
                        <Image src={screenshot} width={100} height={100} alt={`Screenshot ${index + 1}`} />
                      </div>
                    ))}
                </div>
                <div className={styles.ticketFooter}>
                  <span className={styles.ticketDate}>
                    Created: {formatDate(ticket.created_at)}
                  </span>
                  <span className={styles.ticketDate}>
                    Updated: {formatDate(ticket.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noTickets}>
            <p>You haven&apos;t created any support tickets yet.</p>
          </div>
        )}
      </div>

      <div className={styles.faqContainer}>
        {filteredFaqs.map((faq) => (
          <div 
            key={faq.id} 
            className={`${styles.faqItem} ${openQuestion === faq.id ? styles.active : ''}`}
            onClick={() => toggleQuestion(faq.id)}
          >
            <div className={styles.faqHeader}>
              <h3>{faq.question}</h3>
              <span className={styles.toggleIcon}>
                {openQuestion === faq.id ? '−' : '+'}
              </span>
            </div>
            <div className={`${styles.faqAnswer} ${openQuestion === faq.id ? styles.show : ''}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>

      {showContactForm && (
        <div className={styles.contactFormOverlay}>
          <div className={styles.contactForm}>
            <div className={styles.formHeader}>
              <h2>Contact Support</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowContactForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="Brief description of your issue"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  placeholder="Please describe your issue in detail"
                  rows="5"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="screenshots">Screenshots (up to 5, max 10MB each)</label>
                
                <div 
                  className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <input
                    type="file"
                    id="screenshots"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <div className={styles.uploadContent}>
                    {dragActive ? (
                      <p>Drop the files here</p>
                    ) : (
                      <>
                        <p>Drag & drop files here or click to browse</p>
                        <p className={styles.fileInfo}>
                          All image formats accepted. Maximum file size: 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {formData.screenshots.length > 0 && (
                  <div className={styles.screenshotList}>
                    {formData.screenshots.map((screenshot, index) => (
                      <div key={index} className={styles.screenshotItem}>
                        <span>{screenshot.name}</span>
                        <span className={styles.fileSize}>
                          {(screenshot.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className={styles.removeButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowContactForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? <>
                    <ClipLoader color="#fff" size={15} /> Sending...
                  </> : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}