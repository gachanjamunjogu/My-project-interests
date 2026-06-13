import { Task } from "./TaskCard"

export type AuraMode = "deep-work" | "planning" | "review"

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export interface ModeToggleProps {
  mode: AuraMode
  onChange: (mode: AuraMode) => void
}

const MODES: { key: AuraMode; label: string }[] = [
  { key: "deep-work", label: "Deep Work" },
  { key: "planning", label: "Planning" },
  { key: "review", label: "Review" },
]

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1.5 backdrop-blur">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={cx(
            "rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
            mode === m.key ? "bg-[#D4AF37] text-black" : "text-white/70 hover:text-white"
          )}
          aria-pressed={mode === m.key}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
