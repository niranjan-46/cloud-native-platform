import React from 'react'
import DocumentsUpload from '@/components/register/step4/DocumentsUpload'

export default function DocumentsUploadPage(data) {
  return (
    <DocumentsUpload employer={false} consultancy={true} candidate={false} email={data.email}/>
  )
}
