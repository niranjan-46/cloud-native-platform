import React from 'react'
import ProfessionalDetails from '../../../../components/register/step2/professionalDetails'

export default function ProfessionalDetailsPage(data) {
  return (
    <ProfessionalDetails employer={true} consultancy={false} candidate={false} email={data.email}/>
  )
}
