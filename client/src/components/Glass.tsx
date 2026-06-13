import { ReactNode } from "react"

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export interface GlassProps {
  className?: string
  children: ReactNode
}

export function Glass({ className, children }: GlassProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-[#D4AF37]/15 bg-[#0B0B0B]/60 backdrop-blur-xl",
        "shadow-[0_18px_60px_rgba(0,0,0,0.65)]",
        className
      )}
    >
      {children}
    </div>
  )
}
