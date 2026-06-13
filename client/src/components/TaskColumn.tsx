import { Task, TaskStatus, TaskCard } from "./TaskCard"

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export interface TaskColumnProps {
  status: TaskStatus
  label: string
  tasks: Task[]
  onOpenTask: (id: string) => void
  className?: string
}

export function TaskColumn({
  status,
  label,
  tasks,
  onOpenTask,
  className,
}: TaskColumnProps) {
  return (
    <div
      className={cx("flex min-w-[260px] flex-col gap-3", className)}
      role="region"
      aria-label={`${label} column with ${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/90">{label}</span>
          <span
            className="text-xs text-white/40"
            aria-label={`${tasks.length} tasks in ${label}`}
          >
            {tasks.length}
          </span>
        </div>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/25 to-transparent" />
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </div>
  )
}
