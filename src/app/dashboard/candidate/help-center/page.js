import React from 'react'
import Help from '@/components/help-center/Help'

const page = () => {
  const faqData = [
    // Application Process
    {
      id: 1,
      question: "How do I apply for a job?",
      answer: "To apply for a job, browse through the available positions, click on the job that interests you, and click the 'Apply Now' button. Make sure your profile is complete and your resume is up to date before applying. The application process typically involves submitting your resume, filling out a brief application form, and sometimes answering job-specific questions. You can track your application status in the 'My Applications' section."
    },
    {
      id: 2,
      question: "What should I include in my job application?",
      answer: "Your job application should include: 1) An updated resume highlighting relevant experience and skills, 2) A compelling cover letter tailored to the position, 3) Any required certifications or licenses, 4) Portfolio or work samples if applicable, 5) References from previous employers or colleagues. Make sure all documents are current and accurately represent your qualifications."
    },
    {
      id: 3,
      question: "How can I track my job applications?",
      answer: "You can track all your job applications in the 'My Applications' section of your dashboard. Here you'll see the status of each application, including whether it's under review, shortlisted, or rejected. You can also view application history, save job postings for later, and receive notifications about status updates. The system automatically organizes applications by status and date for easy reference."
    },
    // Profile Management
    {
      id: 4,
      question: "How do I update my profile information?",
      answer: "Go to your profile section and click on the 'Edit Profile' button. You can update your personal information, skills, work experience, and education details. Remember to save your changes after updating. The profile section includes multiple tabs for different types of information: Personal Details, Professional Experience, Education, Skills, Certifications, and Portfolio. Each section can be edited independently."
    },
    {
      id: 5,
      question: "What makes a strong candidate profile?",
      answer: "A strong candidate profile includes: 1) A professional photo, 2) A compelling summary of your career objectives, 3) Detailed work experience with measurable achievements, 4) Relevant skills and certifications, 5) Educational background, 6) Portfolio or work samples, 7) Professional recommendations, 8) Industry-specific keywords for better visibility. Keep your profile updated and ensure all information is accurate and professional."
    },
    // Resume and Documents
    {
      id: 6,
      question: "How do I upload and manage my resume?",
      answer: "Go to the 'Documents' section in your profile and click 'Upload Resume'. You can upload multiple versions of your resume in PDF, DOC, or DOCX format. The system allows you to set a primary resume and manage different versions for different types of positions. You can also update your resume at any time and track which version was used for each application."
    },
    {
      id: 7,
      question: "What file formats are accepted for documents?",
      answer: "The platform accepts the following file formats: 1) Resumes: PDF, DOC, DOCX (max 5MB), 2) Cover Letters: PDF, DOC, DOCX (max 2MB), 3) Certificates: PDF, JPG, PNG (max 2MB), 4) Portfolio: PDF, JPG, PNG, ZIP (max 10MB). Make sure your files are virus-free and properly formatted before uploading."
    },
    // Job Search
    {
      id: 8,
      question: "How can I search for jobs effectively?",
      answer: "Use the advanced search filters to find relevant jobs: 1) Keywords for job titles or skills, 2) Location preferences, 3) Job type (full-time, part-time, contract), 4) Experience level, 5) Salary range, 6) Company size, 7) Industry. You can save your search criteria and set up job alerts for new matching positions. The platform also provides job recommendations based on your profile and search history."
    },
    {
      id: 9,
      question: "How do I save jobs for later?",
      answer: "When viewing a job listing, click the 'Save Job' button to add it to your saved jobs list. You can access all saved jobs in the 'Saved Jobs' section of your dashboard. You can organize saved jobs into different folders, add notes, and set reminders for application deadlines. The system also notifies you if a saved job is about to expire or if there are any updates to the position."
    },
    // Interviews
    {
      id: 10,
      question: "How do I prepare for interviews?",
      answer: "Prepare for interviews by: 1) Researching the company and role thoroughly, 2) Reviewing common interview questions, 3) Preparing your own questions, 4) Practicing with mock interviews, 5) Preparing your portfolio and work samples, 6) Dressing appropriately, 7) Testing your technology for virtual interviews. The platform provides interview preparation resources and tips in the 'Resources' section."
    },
    // Notifications
    {
      id: 11,
      question: "How do I manage job notifications?",
      answer: "Configure your notification preferences in the 'Settings' section: 1) Choose notification methods (email, in-app, push), 2) Set notification frequency, 3) Select types of notifications (new jobs, application updates, messages), 4) Set quiet hours, 5) Choose notification language. You can also create custom notification rules for specific job categories or companies."
    },
    // Account Security
    {
      id: 12,
      question: "How do I secure my account?",
      answer: "Secure your account by: 1) Using a strong password, 2) Enabling two-factor authentication, 3) Regularly updating your password, 4) Monitoring login activity, 5) Keeping your email address updated, 6) Not sharing your login credentials, 7) Logging out after each session. The platform also provides security tips and alerts for suspicious activities."
    },
    // Privacy
    {
      id: 13,
      question: "How is my personal information protected?",
      answer: "Your personal information is protected through: 1) Data encryption, 2) Secure servers, 3) Privacy controls, 4) Regular security audits, 5) Compliance with data protection regulations, 6) Limited access to personal data, 7) Secure file storage. You can control what information is visible to employers and other users in your privacy settings."
    },
    // Communication
    {
      id: 14,
      question: "How do I communicate with employers?",
      answer: "Communicate with employers through: 1) The built-in messaging system, 2) Application status updates, 3) Interview scheduling tools, 4) Document sharing, 5) Video interview platform. Keep communications professional and timely. The platform provides templates and guidelines for effective employer communication."
    },
    // Career Development
    {
      id: 15,
      question: "How can I improve my job search success?",
      answer: "Improve your job search success by: 1) Optimizing your profile, 2) Networking actively, 3) Applying to relevant positions, 4) Following up on applications, 5) Seeking feedback, 6) Continuous learning, 7) Building a strong online presence. The platform offers career development resources and personalized recommendations."
    }
    // ... Add more questions as needed
  ];
  return (
    <div>
      <Help queys={faqData} />
    </div>
  )
}

export default page