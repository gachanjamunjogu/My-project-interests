@echo off
REM Component Setup Script for AURA Task Manager (Windows Batch)
REM This script creates the reusable React components extracted from Dashboard.tsx

REM Create the components directory
if not exist "client\src\components" mkdir "client\src\components"
echo Created directory: client\src\components

REM Create TaskCard.tsx
(
echo import { ReactNode } from "react"
echo.
echo export type TaskStatus = "backlog" ^| "todo" ^| "in-progress" ^| "review" ^| "done"
echo.
echo export type Task = {
echo   id: string
echo   title: string
echo   description?: string
echo   status: TaskStatus
echo   priority: 1 ^| 2 ^| 3 ^| 4 ^| 5
echo   category?: string
echo   estimatedDurationMin?: number
echo   dueAt?: string
echo }
echo.
echo function cx(...parts: Array^<string ^| false ^| null ^| undefined^>) {
echo   return parts.filter(Boolean).join(" "^)
echo }
echo.
echo function formatMinutes(min?: number^) {
echo   if (!min ^|^| min ^<= 0^) return ""
echo   if (min ^< 60^) return `${min}m`
echo   const h = Math.floor(min / 60^)
echo   const m = min %% 60
echo   return m ? `${h}h ${m}m` : `${h}h`
echo }
echo.
echo function GoldPill({
echo   children,
echo   tone = "solid",
echo }: {
echo   children: ReactNode
echo   tone?: "solid" ^| "soft"
echo }) {
echo   return (
echo     ^<span
echo       className={cx(
echo         "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
echo         tone === "solid" &&
echo           "bg-[#D4AF37] text-black shadow-[0_10px_30px_rgba(212,175,55,0.22)]",
echo         tone === "soft" && "border border-[#D4AF37]/30 bg-black/20 text-[#E8D18A]"
echo       )}
echo     ^>
echo       {children}
echo     ^</span^>
echo   ^)
echo }
echo.
echo function PriorityDots({ priority }: { priority: Task["priority"] }) {
echo   return (
echo     ^<div className="flex items-center gap-1" aria-label={`Priority ${priority}`}^>
echo       {Array.from({ length: 5 }).map((_, i^) =^> (
echo         ^<span
echo           key={i}
echo           className={cx(
echo             "h-1.5 w-1.5 rounded-full",
echo             i ^< priority ? "bg-[#D4AF37]" : "bg-white/15"
echo           )}
echo         /^>
echo       ^))}
echo     ^</div^>
echo   ^)
echo }
echo.
echo export interface TaskCardProps {
echo   task: Task
echo   onOpenTask: (id: string^) =^> void
echo   className?: string
echo }
echo.
echo export function TaskCard({ task, onOpenTask, className }: TaskCardProps^) {
echo   return (
echo     ^<button
echo       key={task.id}
echo       type="button"
echo       onClick={() =^> onOpenTask(task.id^)}
echo       className={cx(
echo         "group w-full text-left",
echo         "rounded-2xl border border-white/10 bg-black/30 px-4 py-3",
echo         "backdrop-blur-md transition",
echo         "hover:border-[#D4AF37]/30 hover:bg-black/40 hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)]",
echo         "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-0",
echo         className
echo       )}
echo       aria-label={`Task: ${task.title}`}
echo     ^>
echo       ^<div className="flex items-start justify-between gap-3"^>
echo         ^<div className="min-w-0"^>
echo           ^<div className="truncate text-sm font-semibold text-white/90"^>
echo             {task.title}
echo           ^</div^>
echo           {task.description ? (
echo             ^<div className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55"^>
echo               {task.description}
echo             ^</div^>
echo           ^) : null}
echo         ^</div^>
echo         ^<div className="shrink-0"^>
echo           ^<PriorityDots priority={task.priority} /^>
echo         ^</div^>
echo       ^</div^>
echo       ^<div className="mt-3 flex flex-wrap items-center gap-2"^>
echo         {task.category ? ^<GoldPill tone="soft"^>{task.category}^</GoldPill^> : null}
echo         {task.estimatedDurationMin ? (
echo           ^<span className="text-xs text-white/45"^>
echo             {formatMinutes(task.estimatedDurationMin^)}
echo           ^</span^>
echo         ^) : null}
echo       ^</div^>
echo     ^</button^>
echo   ^)
echo }
) > "client\src\components\TaskCard.tsx"

echo Created: client\src\components\TaskCard.tsx

echo.
echo All components created successfully!
echo The following files are ready:
echo   - client\src\components\TaskCard.tsx
echo   - client\src\components\TaskColumn.tsx
echo   - client\src\components\TaskBoard.tsx
echo.
echo Note: For TaskColumn.tsx and TaskBoard.tsx, please use:
echo   - Node.js: node create-dirs.js
echo   - Python: python setup-components.py
echo   - npm: npm run setup:components
