'use client'

import dynamic from 'next/dynamic'

const PrototaxitesApp = dynamic(
  () => import('./PrototaxitesApp'),
  {
    ssr: false,
    loading: () => <div style={{ position: 'fixed', inset: 0, background: '#000' }} />,
  },
)

export default function PrototaxitesLoader() {
  return <PrototaxitesApp />
}
