import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { syncService } from "../../services/syncService"

export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done"

export type AuraMode = "deep-work" | "planning" | "review"

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

interface TasksState {
  tasks: Task[]
  mode: AuraMode
  command: string
  drawerOpen: boolean
  activeTaskId: string | null
  isOnline: boolean
}

const initialState: TasksState = {
  tasks: [
    {
      id: "t1",
      title: "Draft weekly review",
      description: "Summarize wins, blockers, and next steps.",
      status: "review",
      priority: 3,
      category: "Reflection",
      estimatedDurationMin: 45,
    },
    {
      id: "t2",
      title: "Deep work: build offline sync queue",
      description: "Persist actions in IndexedDB and replay when online.",
      status: "in-progress",
      priority: 5,
      category: "Engineering",
      estimatedDurationMin: 120,
    },
    {
      id: "t3",
      title: "Plan tomorrow itinerary",
      description: "Select 3 high-impact tasks, timebox, and add buffers.",
      status: "todo",
      priority: 4,
      category: "Planning",
      estimatedDurationMin: 30,
    },
  ],
  mode: "deep-work",
  command: "",
  drawerOpen: false,
  activeTaskId: null,
  isOnline: syncService.isOnlineStatus,
}

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload
    },
    addTask(state, action: PayloadAction<Task>) {
      state.tasks.unshift(action.payload)
    },
    updateTask(state, action: PayloadAction<Task>) {
      state.tasks = state.tasks.map((task) =>
        task.id === action.payload.id ? action.payload : task
      )
    },
    removeTask(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload)
    },
    setMode(state, action: PayloadAction<AuraMode>) {
      state.mode = action.payload
    },
    setCommand(state, action: PayloadAction<string>) {
      state.command = action.payload
    },
    setDrawerOpen(state, action: PayloadAction<boolean>) {
      state.drawerOpen = action.payload
    },
    setActiveTaskId(state, action: PayloadAction<string | null>) {
      state.activeTaskId = action.payload
    },
    setOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload
    },
    clearSelection(state) {
      state.activeTaskId = null
    },
  },
})

export const {
  setTasks,
  addTask,
  updateTask,
  removeTask,
  setMode,
  setCommand,
  setDrawerOpen,
  setActiveTaskId,
  setOnline,
  clearSelection,
} = tasksSlice.actions

export default tasksSlice.reducer
