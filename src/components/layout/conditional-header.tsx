'use client'

import { usePathname } from 'next/navigation'
import { isImmersiveRoute } from '@/lib/routes'
import Header from './header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  if (isImmersiveRoute(pathname)) return null
  return <Header />
}
