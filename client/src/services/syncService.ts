import { Task } from "../features/tasks/taskSlice"
import { indexedDBService } from "./indexedDBService"
import { createTask, updateTask, deleteTask } from "./taskService"

class SyncService {
  private isOnline = navigator.onLine
  private syncInProgress = false

  constructor() {
    this.init()
  }

  private init() {
    window.addEventListener("online", () => {
      this.isOnline = true
      this.performSync()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
    })

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        console.log("Service Worker registered:", registration)
      }).catch((error) => {
        console.error("Service Worker registration failed:", error)
      })
    }
  }

  get isOnlineStatus(): boolean {
    return this.isOnline
  }

  async loadTasks(): Promise<Task[]> {
    try {
      // Try to load from server first
      if (this.isOnline) {
        const serverTasks = await this.fetchTasksFromServer()
        // Save to IndexedDB for offline access
        await indexedDBService.saveTasks(serverTasks)
        return serverTasks
      }
    } catch (error) {
      console.warn("Failed to load from server, falling back to local storage:", error)
    }

    // Fallback to local storage
    return await indexedDBService.getAllTasks()
  }

  async saveTask(task: Task): Promise<void> {
    // Always save to local storage first
    await indexedDBService.saveTask(task)

    // Try to sync to server if online
    if (this.isOnline) {
      try {
        await this.syncTaskToServer(task)
      } catch (error) {
        console.warn("Failed to sync task to server:", error)
        // Task remains in local storage, will be synced when online
      }
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    // Always delete from local storage first
    await indexedDBService.deleteTask(taskId)

    // Try to sync to server if online
    if (this.isOnline) {
      try {
        await deleteTask(taskId)
      } catch (error) {
        console.warn("Failed to delete task from server:", error)
        // Task remains deleted locally, will be synced when online
      }
    }
  }

  async performSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return

    this.syncInProgress = true
    try {
      const pendingTasks = await indexedDBService.getPendingSync()

      for (const task of pendingTasks) {
        try {
          await this.syncTaskToServer(task)
          // Remove updatedAt to mark as synced
          delete (task as any).updatedAt
          await indexedDBService.saveTask(task)
        } catch (error) {
          console.error("Failed to sync task:", task.id, error)
        }
      }

      console.log("Sync completed")
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async fetchTasksFromServer(): Promise<Task[]> {
    // This would call the existing fetchTasks function
    // For now, we'll import it dynamically to avoid circular dependencies
    const { fetchTasks } = await import("./taskService")
    const serverTasks = await fetchTasks()
    return serverTasks.map((task: any) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status ?? "todo",
      priority: task.priority ?? 3,
      category: task.category,
      estimatedDurationMin: task.estimatedDurationMin,
      dueAt: task.dueAt,
    }))
  }

  private async syncTaskToServer(task: Task): Promise<void> {
    const taskData = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      estimatedDurationMin: task.estimatedDurationMin,
      dueAt: task.dueAt,
    }

    // Check if task exists on server
    try {
      if (task.id.startsWith("t_")) {
        // New task, create it
        await createTask(taskData)
      } else {
        // Existing task, update it
        await updateTask(task.id, taskData)
      }
    } catch (error) {
      // If update fails, try create (task might not exist on server)
      if (!task.id.startsWith("t_")) {
        try {
          await createTask(taskData)
        } catch (createError) {
          throw createError
        }
      } else {
        throw error
      }
    }
  }
}

export const syncService = new SyncService()