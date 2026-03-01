import React from 'react'
import Help from '@/components/help-center/Help'

const page = () => {
  const faqData = [
    {
      id: 1,
      question: "How do I post a new job?",
      answer: "To post a new job, go to your dashboard and click on 'Post a Job'. Fill in the job details including title, description, requirements, and location. You can also set the job type, salary range, and application deadline."
    },
    {
      id: 2,
      question: "How can I manage job applications?",
      answer: "You can manage all applications in the 'Applications' section of your dashboard. Here you can view candidate profiles, review applications, schedule interviews, and update application statuses."
    },
    {
      id: 3,
      question: "How do I edit or delete a job posting?",
      answer: "Go to the 'Posted Jobs' section, find the job you want to modify, and click on the edit or delete button. For editing, you can update any job details. For deletion, you'll be asked to confirm before the job is removed."
    },
    {
      id: 4,
      question: "How do I schedule interviews with candidates?",
      answer: "When viewing a candidate's application, click on 'Schedule Interview'. You can choose the date, time, and interview type (in-person, video call, or phone). The candidate will receive a notification with the interview details."
    },
    {
      id: 5,
      question: "How can I search for candidates?",
      answer: "Use the 'Search Candidates' feature in your dashboard. You can filter candidates by skills, experience, location, and other criteria. You can also save promising candidates to your shortlist for future reference."
    },
    {
      id: 6,
      question: "How do I manage my company profile?",
      answer: "Go to 'Company Profile' in your dashboard settings. Here you can update your company information, logo, description, and other details. A complete profile helps attract better candidates."
    }
  ];
  
  return (
    <div>
      <Help queys={faqData} />
    </div>
  )
}

export default page