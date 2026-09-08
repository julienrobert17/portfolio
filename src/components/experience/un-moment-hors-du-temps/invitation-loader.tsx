'use client'

import dynamic from 'next/dynamic'

const InvitationApp = dynamic(() => import('./invitation-app'), {
  ssr: false,
  loading: () => <div style={{ position: 'fixed', inset: 0, background: '#F7F1E6' }} />,
})

export default function InvitationLoader() {
  return <InvitationApp />
}
