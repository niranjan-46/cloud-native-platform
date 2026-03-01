import React from 'react'
import Help from '@/components/help-center/Help'

const page = () => {
  const faqData = [
    {
      id: 1,
      question: "How do I create a new consultancy profile?",
      answer: "Go to your dashboard and click on 'Create Profile'. Fill in your consultancy details including company name, services offered, expertise areas, and contact information. Upload your company logo and any relevant certifications."
    },
    {
      id: 2,
      question: "How can I manage client projects?",
      answer: "Access the 'Projects' section in your dashboard to view and manage all client projects. You can track project status, update milestones, communicate with clients, and manage deliverables from this central location."
    },
    {
      id: 3,
      question: "How do I submit proposals for jobs?",
      answer: "Browse available jobs in the 'Job Board' section. When you find a suitable opportunity, click 'Submit Proposal' and provide your approach, timeline, and pricing. You can also attach relevant case studies or portfolio items."
    },
    {
      id: 4,
      question: "How can I track my consultancy's performance?",
      answer: "Use the 'Analytics' dashboard to monitor key metrics like project completion rate, client satisfaction scores, revenue, and growth. You can generate reports and export data for detailed analysis."
    },
    {
      id: 5,
      question: "How do I manage my team members?",
      answer: "Go to 'Team Management' in your dashboard settings. Here you can add team members, assign roles and permissions, track their workload, and manage their access to different projects and features."
    },
    {
      id: 6,
      question: "How can I handle client communications?",
      answer: "Use the built-in messaging system in your dashboard to communicate with clients. You can send messages, share files, schedule meetings, and maintain a record of all communications in one place."
    }
  ];
  
  return (
    <div>
      <Help queys={faqData} />
    </div>
  )
}

export default page