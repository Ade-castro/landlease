import { useEffect, useRef, useState } from 'react'

/** Fades an element in once it scrolls into view; a no-op if the visitor prefers reduced motion. */
export function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } }, { threshold: 0.15 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return { ref, className: visible ? 'reveal in-view' : 'reveal', style: { transitionDelay: `${delay}ms` } }
}
