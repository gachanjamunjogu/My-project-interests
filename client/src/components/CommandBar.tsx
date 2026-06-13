import { Task } from "./TaskCard"
import { Glass } from "./Glass"

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export interface CommandBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isOnline: boolean
  onOpenAi: () => void
  isLoading?: boolean
}

export function CommandBar({
  value,
  onChange,
  onSubmit,
  isOnline,
  onOpenAi,
  isLoading = false,
}: CommandBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      onSubmit()
    }
  }

  return (
    <Glass className="px-5 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-base font-semibold tracking-wide text-white/90">AURA</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
                isOnline ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200"
              )}
              role="status"
            >
              <span
                className={cx(
                  "h-2 w-2 rounded-full",
                  isOnline ? "bg-emerald-300" : "bg-amber-300"
                )}
              />
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2 md:max-w-[680px]">
          <div className="relative flex-1">
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Try: "Meeting tomorrow at 2pm"'
              disabled={isLoading}
              aria-label="Quick add task"
              className={cx(
                "w-full rounded-2xl border border-white/10 bg-black/35 px-5 py-3.5 text-base",
                "text-white/90 placeholder:text-white/35 backdrop-blur",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
                "disabled:opacity-50"
              )}
            />
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <span className="text-sm text-white/35">Enter</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAi}
            disabled={isLoading}
            className={cx(
              "rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-3.5",
              "text-base font-semibold text-[#E8D18A] backdrop-blur transition",
              "hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/15",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            AI
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className={cx(
              "rounded-2xl bg-[#D4AF37] px-5 py-3.5 text-base font-bold text-black",
              "shadow-[0_18px_45px_rgba(212,175,55,0.22)] transition",
              "hover:bg-[#C5A021] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Add
          </button>
        </div>
      </div>
    </Glass>
  )
}
