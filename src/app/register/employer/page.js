"use client";

import RegistrationForm from '@/components/register/RegistrationForm';

export default function EmployerRegister() {
  return (
      <RegistrationForm employer={true} consultancy={false} candidate={false} />
  );
} 