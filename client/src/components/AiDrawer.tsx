import { Task } from "./TaskCard"
import { Glass } from "./Glass"

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function GoldPill({
  children,
  tone = "solid",
}: {
  children: React.ReactNode
  tone?: "solid" | "soft"
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium tracking-wide",
        tone === "solid" &&
          "bg-[#D4AF37] text-black shadow-[0_10px_30px_rgba(212,175,55,0.22)]",
        tone === "soft" && "border border-[#D4AF37]/30 bg-black/20 text-[#E8D18A]"
      )}
    >
      {children}
    </span>
  )
}

export interface AiDrawerProps {
  open: boolean
  input: string
  preview: Partial<Task> | null
  loading: boolean
  error: string | null
  onClose: () => void
  onParse: () => void
  onAccept: () => void
  onReject: () => void
  onInputChange?: (value: string) => void
}

export function AiDrawer({
  open,
  input,
  preview,
  loading,
  error,
  onClose,
  onParse,
  onAccept,
  onReject,
  onInputChange,
}: AiDrawerProps) {
  return (
    <div
      className={cx(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cx(
          "absolute inset-0 bg-black/70 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cx(
          "absolute right-0 top-0 h-full w-full max-w-[520px] transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="AI suggestions"
      >
        <div className="h-full p-5">
          <Glass className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <GoldPill>AI</GoldPill>
                <span className="text-base font-semibold text-white/90">Parse task</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cx(
                  "rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/70",
                  "hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                )}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!preview && !loading && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold uppercase tracking-wide text-white/60">
                      Input
                    </label>
                    {onInputChange ? (
                      <textarea
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Describe your task here..."
                        className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 p-4 text-base text-white/90 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 resize-none"
                        rows={4}
                      />
                    ) : (
                      <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-4">
                        <p className="text-base text-white/90">{input || "No input yet"}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-3 inline-block h-8 w-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
                    <p className="text-base text-white/60">Parsing with Gemini...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-base text-red-200">{error}</p>
                </div>
              )}

              {preview && !loading && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold uppercase tracking-wide text-white/60">
                      Title
                    </label>
                    <p className="mt-2 text-base font-semibold text-white/90">{preview.title}</p>
                  </div>

                  {preview.description && (
                    <div>
                      <label className="text-sm font-semibold uppercase tracking-wide text-white/60">
                        Description
                      </label>
                      <p className="mt-2 text-base text-white/70">{preview.description}</p>
                    </div>
                  )}

                  {preview.priority && (
                    <div>
                      <label className="text-sm font-semibold uppercase tracking-wide text-white/60">
                        Priority
                      </label>
                      <div className="mt-2">
                        <GoldPill tone="soft">Priority {preview.priority}</GoldPill>
                      </div>
                    </div>
                  )}

                  {preview.category && (
                    <div>
                      <label className="text-sm font-semibold uppercase tracking-wide text-white/60">
                        Category
                      </label>
                      <div className="mt-2">
                        <GoldPill tone="soft">{preview.category}</GoldPill>
                      </div>
                    </div>
                  )}

                  {preview.estimatedDurationMin && (
                    <div>
                      <label className="text-sm font-semibold uppercase tracking-wide text-white/60">
                        Duration
                      </label>
                      <p className="mt-2 text-base text-white/70">
                        {Math.floor(preview.estimatedDurationMin / 60)}h{" "}
                        {preview.estimatedDurationMin % 60}m
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {preview && !loading && (
              <div className="border-t border-white/10 px-5 py-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onAccept}
                    className={cx(
                      "flex-1 rounded-lg bg-[#D4AF37] px-5 py-3 text-base font-bold text-black",
                      "shadow-[0_10px_30px_rgba(212,175,55,0.22)] transition",
                      "hover:bg-[#C5A021] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                    )}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={onReject}
                    className={cx(
                      "flex-1 rounded-lg border border-white/20 bg-black/30 px-5 py-3 text-base font-bold text-white/90",
                      "transition hover:border-white/40 hover:bg-black/40",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                    )}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {!preview && !loading && (
              <div className="border-t border-white/10 px-5 py-4">
                <button
                  type="button"
                  onClick={onParse}
                  disabled={!input}
                  className={cx(
                    "w-full rounded-lg bg-[#D4AF37] px-5 py-3 text-base font-bold text-black",
                    "shadow-[0_10px_30px_rgba(212,175,55,0.22)] transition",
                    "hover:bg-[#C5A021] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Parse with AI
                </button>
              </div>
            )}
          </Glass>
        </div>
      </div>
    </div>
  )
}
