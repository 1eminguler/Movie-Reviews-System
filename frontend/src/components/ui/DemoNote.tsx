import { IS_DEMO } from '../../config.ts'

// Yalnızca demo derlemesinde görünür: örnek veri ve demo hesabı bilgisi
export default function DemoNote({ className = '' }: { className?: string }) {
  if (!IS_DEMO) return null
  return (
    <p className={`text-[13px] leading-relaxed text-mute ${className}`}>
      <span className="mr-2 rounded-full border border-accent/50 px-2 py-0.5 text-[12px] font-medium text-accent">Demo</span>
      Sample data. Sign in with <span className="font-medium text-ink">demo</span> / <span className="font-medium text-ink">demo1234</span>
    </p>
  )
}
