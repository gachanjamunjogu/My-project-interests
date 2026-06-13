import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "../app/hooks"
import api from "../services/api"
import { syncService } from "../services/syncService"
import {
  addTask,
  setActiveTaskId,
  setCommand,
  setDrawerOpen,
  setMode,
  setOnline,
  setTasks,
  updateTask as updateTaskAction,
  removeTask,
} from "../features/tasks/taskSlice"
import { TaskBoard, type AuraMode } from "../components/TaskBoard"
import { CommandBar } from "../components/CommandBar"
import { ModeToggle } from "../components/ModeToggle"
import { Glass } from "../components/Glass"
import { AiDrawer } from "../components/AiDrawer"
import {
  createTask,
  fetchTasks,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
  type TaskResponse,
} from "../services/taskService"

type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done"

type Task = {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: 1 | 2 | 3 | 4 | 5
  category?: string
  estimatedDurationMin?: number
  dueAt?: string
}

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

function formatMinutes(min?: number) {
  if (!min || min <= 0) return ""
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
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

function PriorityDots({ priority }: { priority: Task["priority"] }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Priority ${priority}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cx(
            "h-2 w-2 rounded-full",
            i < priority ? "bg-[#D4AF37]" : "bg-white/15"
          )}
        />
      ))}
    </div>
  )
}

function StatusColumn({
  status,
  label,
  tasks,
  onOpenTask,
}: {
  status: TaskStatus
  label: string
  tasks: Task[]
  onOpenTask: (id: string) => void
}) {
  return (
    <div className="flex min-w-[280px] flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-white/90">{label}</span>
          <span className="text-sm text-white/40">{tasks.length}</span>
        </div>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/25 to-transparent" />
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onOpenTask(t.id)}
            className={cx(
              "group text-left",
              "rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5",
              "backdrop-blur-md transition",
              "hover:border-[#D4AF37]/30 hover:bg-black/40 hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-0"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-white/90">
                  {t.title}
                </div>
                {t.description ? (
                  <div className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/55">
                    {t.description}
                  </div>
                ) : null}
              </div>
              <div className="shrink-0">
                <PriorityDots priority={t.priority} />
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {t.category ? <GoldPill tone="soft">{t.category}</GoldPill> : null}
              {t.estimatedDurationMin ? (
                <span className="text-sm text-white/45">{formatMinutes(t.estimatedDurationMin)}</span>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector((state) => state.tasks.mode)
  const isOnline = useAppSelector((state) => state.tasks.isOnline)
  const command = useAppSelector((state) => state.tasks.command)
  const drawerOpen = useAppSelector((state) => state.tasks.drawerOpen)
  const activeTaskId = useAppSelector((state) => state.tasks.activeTaskId)
  const tasks = useAppSelector((state) => state.tasks.tasks)
  const [loading, setLoading] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)
  const [statusEdit, setStatusEdit] = useState<TaskStatus>("todo")
  const [aiPreview, setAiPreview] = useState<Partial<Task> | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    const onOnline = () => {
      dispatch(setOnline(true))
      syncService.performSync()
    }
    const onOffline = () => dispatch(setOnline(false))
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [dispatch])

  useEffect(() => {
    async function loadTasks() {
      setLoading(true)
      try {
        const tasks = await syncService.loadTasks()
        dispatch(setTasks(tasks))
      } catch (error) {
        console.error("Unable to load tasks", error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [dispatch])

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>()
    STATUSES.forEach((s) => map.set(s.key, []))
    tasks.forEach((t) => map.get(t.status)?.push(t))
    return map
  }, [tasks])

  const activeTask = useMemo(
    () => (activeTaskId ? tasks.find((t) => t.id === activeTaskId) : undefined),
    [activeTaskId, tasks]
  )

  useEffect(() => {
    if (activeTask) {
      setStatusEdit(activeTask.status)
    }
  }, [activeTask])

  const sidebarCollapsed = mode === "deep-work"

  async function addTaskFromCommand() {
    const title = command.trim()
    if (!title) return

    const next: Task = {
      id: `t_${crypto.randomUUID()}`,
      title,
      status: "todo",
      priority: 3,
    }

    dispatch(setCommand(""))
    dispatch(addTask(next))

    try {
      await syncService.saveTask(next)
    } catch (error) {
      console.error("Unable to sync task", error)
      // Task is already in Redux state, will be synced when online
    }
  }

  async function parseAiCommand() {
    const text = command.trim()
    if (!text) {
      setAiError("Please enter a task prompt before parsing.")
      return
    }
    setAiLoading(true)
    setAiError(null)
    setAiPreview(null)

    try {
      const response = await api.post("/ai/parse", {
        text,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      })
      const task = response.data?.task
      if (!task || !task.title) {
        throw new Error("Gemini returned invalid task data")
      }
      setAiPreview({
        ...task,
        id: `ai_${crypto.randomUUID()}`,
      })
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to parse prompt")
    } finally {
      setAiLoading(false)
    }
  }

  async function acceptAiPreview() {
    if (!aiPreview) return
    setAiLoading(true)
    setAiError(null)

    const newTask: Task = {
      id: `t_${crypto.randomUUID()}`,
      title: aiPreview.title ?? command.trim(),
      description: aiPreview.description,
      status: aiPreview.status as TaskStatus ?? "todo",
      priority: aiPreview.priority ?? 3,
      category: aiPreview.category,
      estimatedDurationMin: aiPreview.estimatedDurationMin,
      dueAt: aiPreview.dueAt,
    }

    dispatch(addTask(newTask))
    setAiPreview(null)
    dispatch(setDrawerOpen(false))
    dispatch(setCommand(""))

    try {
      await syncService.saveTask(newTask)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to sync task")
      console.error("AI create task failed", error)
    } finally {
      setAiLoading(false)
    }
  }

  function rejectAiPreview() {
    setAiPreview(null)
    setAiError(null)
    dispatch(setDrawerOpen(false))
  }

  async function saveActiveTaskStatus() {
    if (!activeTask) return
    setTaskError(null)

    const updatedTask = { ...activeTask, status: statusEdit }
    dispatch(updateTaskAction(updatedTask))

    try {
      await syncService.saveTask(updatedTask)
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Unable to sync task update")
      console.error("Task update failed", error)
    }
  }

  async function removeActiveTask() {
    if (!activeTask) return
    setTaskError(null)

    dispatch(removeTask(activeTask.id))
    dispatch(setActiveTaskId(null))

    try {
      await syncService.deleteTask(activeTask.id)
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Unable to sync task deletion")
      console.error("Task delete failed", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(212,175,55,0.14),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.06),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(212,175,55,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 py-5">
        <CommandBar
          value={command}
          onChange={(v) => dispatch(setCommand(v))}
          onSubmit={addTaskFromCommand}
          isOnline={isOnline}
          onOpenAi={() => dispatch(setDrawerOpen(true))}
        />

        <div className="mt-5 flex items-center justify-between gap-4">
          <ModeToggle mode={mode} onChange={(nextMode) => dispatch(setMode(nextMode))} />
          <div className="flex items-center gap-2">
            <GoldPill tone="soft">{sidebarCollapsed ? "Focus Layout" : "Expanded Layout"}</GoldPill>
            <GoldPill tone="soft">{mode.toUpperCase().replace("-", " ")}</GoldPill>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          <div className={cx(sidebarCollapsed ? "lg:hidden" : "lg:block")}>
            <Glass className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-white/90">Today</div>
                  <div className="mt-1 text-sm leading-relaxed text-white/55">
                    Calm momentum. Keep the plan small enough to finish.
                  </div>
                </div>
                <GoldPill tone="soft">{tasks.length} tasks</GoldPill>
              </div>

              <div className="mt-4 space-y-2">
                {tasks
                  .filter((t) => t.status !== "done")
                  .slice(0, mode === "deep-work" ? 3 : 6)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => dispatch(setActiveTaskId(t.id))}
                      className={cx(
                        "w-full rounded-2xl border px-4 py-3.5 text-left transition",
                        activeTaskId === t.id
                          ? "border-[#D4AF37]/35 bg-[#D4AF37]/10"
                          : "border-white/10 bg-black/25 hover:bg-black/35 hover:border-white/15",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-white/90">
                            {t.title}
                          </div>
                          <div className="mt-1 text-sm text-white/50">
                            {t.category || "General"} · {formatMinutes(t.estimatedDurationMin) || "—"}
                          </div>
                        </div>
                        <PriorityDots priority={t.priority} />
                      </div>
                    </button>
                  ))}
              </div>
            </Glass>
          </div>

          <div className="space-y-5">
            <Glass className="px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-base font-semibold text-white/90">Task Engine</div>
                  <span className="text-sm text-white/45">Kanban + Agentic UX</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => dispatch(setDrawerOpen(true))}
                    className={cx(
                      "rounded-2xl border border-white/10 bg-black/25 px-4 py-2.5 text-sm font-semibold text-white/75",
                      "hover:bg-black/35 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                    )}
                  >
                    Open AI Panel
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(setActiveTaskId(null))}
                    className={cx(
                      "rounded-2xl border border-white/10 bg-black/25 px-4 py-2.5 text-sm font-semibold text-white/75",
                      "hover:bg-black/35 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                    )}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </Glass>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {STATUSES.map((s) => (
                <StatusColumn
                  key={s.key}
                  status={s.key}
                  label={s.label}
                  tasks={grouped.get(s.key) || []}
                  onOpenTask={(id) => dispatch(setActiveTaskId(id))}
                />
              ))}
            </div>

            <Glass className="p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-base font-semibold text-white/90">Details</div>
                  <div className="mt-1 text-sm text-white/55">
                    Switch to Planning for an agenda view, or Review for analytics panels.
                  </div>
                </div>
                {activeTask ? <GoldPill tone="soft">{activeTask.status.toUpperCase()}</GoldPill> : null}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                {activeTask ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white/90">{activeTask.title}</div>
                        {activeTask.description ? (
                          <div className="mt-2 text-base leading-relaxed text-white/70">{activeTask.description}</div>
                        ) : (
                          <div className="mt-2 text-base text-white/45">No description</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                        <label className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                          Status
                        </label>
                        <select
                          value={statusEdit}
                          onChange={(e) => setStatusEdit(e.target.value as TaskStatus)}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-base text-white/90 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25"
                        >
                          {STATUSES.map((status) => (
                            <option key={status.key} value={status.key} className="bg-[#0B0B0B] text-white text-base">
                              {status.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={saveActiveTaskStatus}
                            className={cx(
                              "rounded-2xl bg-[#D4AF37] px-5 py-2.5 text-base font-semibold text-black",
                              "hover:bg-[#C5A021] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                            )}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={removeActiveTask}
                            className={cx(
                              "rounded-2xl border border-white/10 bg-black/30 px-5 py-2.5 text-base font-semibold text-white/75",
                              "hover:bg-black/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                            )}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <GoldPill tone="soft">{activeTask.category || "General"}</GoldPill>
                      <GoldPill tone="soft">Priority {activeTask.priority}</GoldPill>
                      {activeTask.estimatedDurationMin ? (
                        <GoldPill tone="soft">{formatMinutes(activeTask.estimatedDurationMin)}</GoldPill>
                      ) : null}
                      {activeTask.dueAt ? <GoldPill tone="soft">{activeTask.dueAt}</GoldPill> : null}
                    </div>
                    {taskError ? (
                      <div className="rounded-2xl bg-[#550000]/20 px-4 py-3 text-sm text-rose-200">
                        {taskError}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-base text-white/55">Select a task to view details.</div>
                )}
              </div>
            </Glass>
          </div>
        </div>
      </div>

      <AiDrawer
        open={drawerOpen}
        input={command}
        preview={aiPreview}
        loading={aiLoading}
        error={aiError}
        onClose={rejectAiPreview}
        onParse={parseAiCommand}
        onAccept={acceptAiPreview}
        onReject={rejectAiPreview}
        onInputChange={(v: string) => dispatch(setCommand(v))}
      />
    </div>
  )
}

