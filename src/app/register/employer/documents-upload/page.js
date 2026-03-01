import React from 'react'
import DocumentsUpload from '@/components/register/step4/DocumentsUpload'

export default function DocumentsUploadPage(data) {
  return (
    <DocumentsUpload employer={true} consultancy={false} candidate={false} email={data.email}/>
  )
}
