import type { Metadata } from 'next'
import { LabScene } from '@/components/lab'

export const metadata: Metadata = {
  title: 'Lab 3D',
}

export default function LabPage() {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        height: '100dvh',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
      <LabScene />
    </main>
  )
}
