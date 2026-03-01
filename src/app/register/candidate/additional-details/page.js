import React from 'react'
import ProfessionalDetails from '../../../../components/register/step2/professionalDetails'

export default function ProfessionalDetailsPage() {
  return (
    <ProfessionalDetails employer={false} consultancy={false} candidate={true}/>
  )
}
