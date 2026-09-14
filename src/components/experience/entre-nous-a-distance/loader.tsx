'use client'

import dynamic from 'next/dynamic'

const AppADistance = dynamic(() => import('./app-a-distance'), {
  ssr: false,
  loading: () => <div style={{ position: 'fixed', inset: 0, background: '#14120F' }} />,
})

export default function LoaderADistance() {
  return <AppADistance />
}
