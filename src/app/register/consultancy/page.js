"use client";

import RegistrationForm from '@/components/register/RegistrationForm';

export default function ConsultancyRegister() {
  return (
    <RegistrationForm employer={false} consultancy={true} candidate={false} />
  );
} 