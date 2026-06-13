import { useMemo } from "react"
import { Task, TaskStatus, TaskColumn } from "./TaskColumn"

export type AuraMode = "deep-work" | "planning" | "review"

const STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "Todo" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
]

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export interface TaskBoardProps {
  tasks: Task[]
  onOpenTask: (id: string) => void
  mode: AuraMode
  className?: string
}

export function TaskBoard({
  tasks,
  onOpenTask,
  mode,
  className,
}: TaskBoardProps) {
  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>()
    STATUSES.forEach((s) => map.set(s.key, []))
    tasks.forEach((t) => map.get(t.status)?.push(t))
    return map
  }, [tasks])

  const displayedStatuses =
    mode === "deep-work"
      ? STATUSES.filter((s) => s.key === "in-progress")
      : STATUSES

  return (
    <div
      className={cx(
        "flex gap-4 overflow-x-auto pb-2",
        mode === "deep-work" ? "justify-center lg:justify-start" : "",
        className
      )}
      role="main"
      aria-label="Task board by status"
    >
      {displayedStatuses.map((s) => (
        <TaskColumn
          key={s.key}
          status={s.key}
          label={s.label}
          tasks={grouped.get(s.key) || []}
          onOpenTask={onOpenTask}
        />
      ))}
    </div>
  )
}
