import { Task } from "../models/Task.js"

export async function fetchTasks(req, res) {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json({ tasks })
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch tasks" })
  }
}

export async function createTask(req, res) {
  try {
    const payload = {
      userId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || "todo",
      priority: req.body.priority || 3,
      category: req.body.category,
      estimatedDurationMin: req.body.estimatedDurationMin,
      dueAt: req.body.dueAt,
      ai: req.body.ai,
    }
    const task = await Task.create(payload)
    res.status(201).json({ task })
  } catch (error) {
    res.status(400).json({ message: "Unable to create task", error: error.message })
  }
}

export async function updateTask(req, res) {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    )

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    res.json({ task })
  } catch (error) {
    res.status(400).json({ message: "Unable to update task", error: error.message })
  }
}

export async function deleteTask(req, res) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }
    res.json({ deleted: true })
  } catch (error) {
    res.status(500).json({ message: "Unable to delete task" })
  }
}
