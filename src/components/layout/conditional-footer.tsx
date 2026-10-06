'use client'

import { usePathname } from 'next/navigation'
import { isImmersiveRoute } from '@/lib/routes'
import Footer from './footer'

/** La home rend son propre footer compact en bas du panneau À propos. */
export default function ConditionalFooter() {
  const pathname = usePathname()
  if (pathname === '/' || isImmersiveRoute(pathname)) return null
  return <Footer />
}
