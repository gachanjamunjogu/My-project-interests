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
    <div className="flex items-center gap-1" aria-label={`Priority ${priority}`}>
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

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector((state) => state.tasks.mode) as AuraMode
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
      status: (aiPreview.status as TaskStatus) ?? "todo",
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

      <div className="relative mx-auto max-w-[1400px] px-4 py-6">
        <CommandBar
          value={command}
          onChange={(v) => dispatch(setCommand(v))}
          onSubmit={addTaskFromCommand}
          isOnline={isOnline}
          onOpenAi={() => dispatch(setDrawerOpen(true))}
          isLoading={loading}
        />

        <div className="mt-6 flex items-center justify-between gap-4">
          <ModeToggle mode={mode} onChange={(nextMode) => dispatch(setMode(nextMode))} />
          <div className="flex items-center gap-2">
            <GoldPill tone="soft">{sidebarCollapsed ? "Focus Layout" : "Expanded Layout"}</GoldPill>
            <GoldPill tone="soft">{mode.toUpperCase().replace("-", " ")}</GoldPill>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          <div className={cx(sidebarCollapsed ? "lg:hidden" : "lg:block")}>
            <Glass className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white/90">Today</div>
                  <div className="mt-1 text-xs leading-relaxed text-white/55">
                    Calm momentum. Keep the plan small enough to finish.
                  </div>
                </div>
                <GoldPill tone="soft">{tasks.length} tasks</GoldPill>
              </div>

              <div className="mt-5 space-y-3">
                {tasks
                  .filter((t) => t.status !== "done")
                  .slice(0, mode === "deep-work" ? 3 : 6)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => dispatch(setActiveTaskId(t.id))}
                      className={cx(
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        activeTaskId === t.id
                          ? "border-[#D4AF37]/35 bg-[#D4AF37]/10"
                          : "border-white/10 bg-black/25 hover:bg-black/35 hover:border-white/15",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white/90">
                            {t.title}
                          </div>
                          <div className="mt-1 text-xs text-white/50">
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

          <div className="space-y-6">
            <Glass className="px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-white/90">Task Engine</div>
                  <span className="text-xs text-white/45">Kanban + Agentic UX</span>
                </div>
              </div>
            </Glass>

            <TaskBoard tasks={tasks} onOpenTask={(id) => dispatch(setActiveTaskId(id))} mode={mode} />

            {activeTask && (
              <Glass className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white/90">{activeTask.title}</h3>
                    {activeTask.description && (
                      <p className="mt-2 text-sm text-white/60">{activeTask.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch(setActiveTaskId(null))}
                    className="text-white/50 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
                      Status
                    </label>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {STATUSES.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => {
                            setStatusEdit(s.key)
                            const updated = { ...activeTask, status: s.key }
                            dispatch(updateTaskAction(updated))
                            syncService.saveTask(updated).catch(console.error)
                          }}
                          className={cx(
                            "rounded-full px-3 py-1 text-xs font-semibold transition",
                            statusEdit === s.key
                              ? "bg-[#D4AF37] text-black"
                              : "border border-white/20 text-white/70 hover:border-white/40"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {taskError && (
                    <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{taskError}</div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={removeActiveTask}
                      className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Glass>
            )}
          </div>
        </div>
      </div>

      <AiDrawer
        open={drawerOpen}
        input={command}
        preview={aiPreview}
        loading={aiLoading}
        error={aiError}
        onClose={() => dispatch(setDrawerOpen(false))}
        onParse={parseAiCommand}
        onAccept={acceptAiPreview}
        onReject={rejectAiPreview}
      />
    </div>
  )
}
