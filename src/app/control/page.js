'use client'
import { useEffect } from 'react'

export default function ControlRedirect() {
  useEffect(() => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/control/`
  }, [])

  return <p>Redirecting to Admin Panel...</p>
}
