import { Task } from "../features/tasks/taskSlice"

const DB_NAME = "AuraDB"
const DB_VERSION = 1
const TASKS_STORE = "tasks"

class IndexedDBService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(TASKS_STORE)) {
          const store = db.createObjectStore(TASKS_STORE, { keyPath: "id" })
          store.createIndex("status", "status", { unique: false })
          store.createIndex("updatedAt", "updatedAt", { unique: false })
        }
      }
    })
  }

  async getAllTasks(): Promise<Task[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TASKS_STORE], "readonly")
      const store = transaction.objectStore(TASKS_STORE)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async saveTask(task: Task): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TASKS_STORE], "readwrite")
      const store = transaction.objectStore(TASKS_STORE)
      const request = store.put({ ...task, updatedAt: Date.now() })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction([TASKS_STORE], "readwrite")
    const store = transaction.objectStore(TASKS_STORE)

    return new Promise((resolve, reject) => {
      let completed = 0
      const total = tasks.length

      if (total === 0) {
        resolve()
        return
      }

      tasks.forEach((task) => {
        const request = store.put({ ...task, updatedAt: Date.now() })
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          completed++
          if (completed === total) resolve()
        }
      })
    })
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TASKS_STORE], "readwrite")
      const store = transaction.objectStore(TASKS_STORE)
      const request = store.delete(taskId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clearAllTasks(): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TASKS_STORE], "readwrite")
      const store = transaction.objectStore(TASKS_STORE)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPendingSync(): Promise<Task[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TASKS_STORE], "readonly")
      const store = transaction.objectStore(TASKS_STORE)
      const index = store.index("updatedAt")
      const request = index.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        // Return tasks that have been modified locally (have updatedAt)
        const tasks = request.result.filter((task: any) => task.updatedAt)
        resolve(tasks)
      }
    })
  }
}

export const indexedDBService = new IndexedDBService()