#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src', 'components');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
} else {
  console.log(`Directory already exists: ${dir}`);
}

// Create TaskCard.tsx
const taskCardContent = `import { ReactNode } from "react"

export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done"

export type Task = {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: 1 | 2 | 3 | 4 | 5
  category?: string
  estimatedDurationMin?: number
  dueAt?: string
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function formatMinutes(min?: number) {
  if (!min || min <= 0) return ""
  if (min < 60) return \`\${min}m\`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? \`\${h}h \${m}m\` : \`\${h}h\`
}

function GoldPill({
  children,
  tone = "solid",
}: {
  children: ReactNode
  tone?: "solid" | "soft"
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        tone === "solid" &&
          "bg-[#D4AF37] text-black shadow-[0_10px_30px_rgba(212,175,55,0.22)]",
        tone === "soft" && "border border-[#D4AF37]/30 bg-black/20 text-[#E8D18A]"
      )}
    >
      {children}
    </span>
  )
}

function PriorityDots({ priority }: { priority: Task["priority"] }) {
  return (
    <div className="flex items-center gap-1" aria-label={\`Priority \${priority}\`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cx(
            "h-1.5 w-1.5 rounded-full",
            i < priority ? "bg-[#D4AF37]" : "bg-white/15"
          )}
        />
      ))}
    </div>
  )
}

export interface TaskCardProps {
  task: Task
  onOpenTask: (id: string) => void
  className?: string
}

export function TaskCard({ task, onOpenTask, className }: TaskCardProps) {
  return (
    <button
      key={task.id}
      type="button"
      onClick={() => onOpenTask(task.id)}
      className={cx(
        "group w-full text-left",
        "rounded-2xl border border-white/10 bg-black/30 px-4 py-3",
        "backdrop-blur-md transition",
        "hover:border-[#D4AF37]/30 hover:bg-black/40 hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-0",
        className
      )}
      aria-label={\`Task: \${task.title}\`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white/90">
            {task.title}
          </div>
          {task.description ? (
            <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">
              {task.description}
            </div>
          ) : null}
        </div>
        <div className="shrink-0">
          <PriorityDots priority={task.priority} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {task.category ? <GoldPill tone="soft">{task.category}</GoldPill> : null}
        {task.estimatedDurationMin ? (
          <span className="text-xs text-white/45">
            {formatMinutes(task.estimatedDurationMin)}
          </span>
        ) : null}
      </div>
    </button>
  )
}
`;

fs.writeFileSync(path.join(dir, 'TaskCard.tsx'), taskCardContent);
console.log('Created: client/src/components/TaskCard.tsx');

// Create TaskColumn.tsx
const taskColumnContent = `import { Task, TaskStatus, TaskCard } from "./TaskCard"

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
      aria-label={\`\${label} column with \${tasks.length} task\${tasks.length !== 1 ? "s" : ""}\`}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/90">{label}</span>
          <span
            className="text-xs text-white/40"
            aria-label={\`\${tasks.length} tasks in \${label}\`}
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
`;

fs.writeFileSync(path.join(dir, 'TaskColumn.tsx'), taskColumnContent);
console.log('Created: client/src/components/TaskColumn.tsx');

// Create TaskBoard.tsx
const taskBoardContent = `import { useMemo } from "react"
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
`;

fs.writeFileSync(path.join(dir, 'TaskBoard.tsx'), taskBoardContent);
console.log('Created: client/src/components/TaskBoard.tsx');
