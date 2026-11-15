import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { EASE_ENTER } from '../../lib/motion.ts'

// Başlık kelimeleri maskelerinin içinden yükselir; ekran okuyucu düz metni okur,
// azaltılmış harekette başlık ilk karede yerinde durur
export function RiseWords({
  text,
  delay = 0,
  stagger = 0.06,
  className = '',
}: {
  text: string
  delay?: number
  stagger?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>
            <span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] pr-[0.04em] -mr-[0.04em] align-bottom">
              <motion.span
                className="inline-block"
                initial={reduce ? false : { y: '105%' }}
                animate={{ y: '0%' }}
                transition={{
                  duration: 0.7,
                  ease: EASE_ENTER,
                  delay: delay + Math.min(i * stagger, 0.24),
                }}
              >
                {word}
              </motion.span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </span>
  )
}

// Başlığın ardından gelen satırlar 12px aşağıdan belirir (yalnızca yüklemede, bir kez)
export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, ease: EASE_ENTER, delay }}
    >
      {children}
    </motion.div>
  )
}
