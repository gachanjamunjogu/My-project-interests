import api from "./api"

export type TaskInput = {
  title: string
  description?: string
  status?: "backlog" | "todo" | "in-progress" | "review" | "done"
  priority?: 1 | 2 | 3 | 4 | 5
  category?: string
  estimatedDurationMin?: number
  dueAt?: string
}

export type TaskResponse = TaskInput & {
  _id: string
  userId?: string
  createdAt: string
  updatedAt: string
  ai?: {
    source?: string
    confidence?: number
  }
}

export async function fetchTasks() {
  const response = await api.get("/tasks")
  return response.data.tasks as TaskResponse[]
}

export async function createTask(task: TaskInput) {
  const response = await api.post("/tasks", task)
  return response.data.task as TaskResponse
}

export async function updateTask(id: string, task: Partial<TaskInput>) {
  const response = await api.put(`/tasks/${id}`, task)
  return response.data.task as TaskResponse
}

export async function deleteTask(id: string) {
  const response = await api.delete(`/tasks/${id}`)
  return response.data
}
