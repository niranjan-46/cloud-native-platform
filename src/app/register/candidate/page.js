"use client";

import RegistrationForm from '@/components/register/RegistrationForm';

export default function CandidateRegister() {
  return (
    <RegistrationForm employer={false} consultancy={false} candidate={true} />
  );
} 