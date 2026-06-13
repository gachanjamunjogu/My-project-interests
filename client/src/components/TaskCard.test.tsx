import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TaskCard } from "../components/TaskCard"

const mockTask = {
  id: "task-1",
  title: "Buy groceries",
  description: "Get milk and eggs",
  status: "todo" as const,
  priority: 2 as const,
  category: "shopping",
  estimatedDurationMin: 30,
}

describe("TaskCard", () => {
  it("renders task title", () => {
    const mockOnOpen = vi.fn()
    render(<TaskCard task={mockTask} onOpenTask={mockOnOpen} />)
    expect(screen.getByText("Buy groceries")).toBeDefined()
  })

  it("renders task description", () => {
    const mockOnOpen = vi.fn()
    render(<TaskCard task={mockTask} onOpenTask={mockOnOpen} />)
    expect(screen.getByText("Get milk and eggs")).toBeDefined()
  })

  it("renders category pill", () => {
    const mockOnOpen = vi.fn()
    render(<TaskCard task={mockTask} onOpenTask={mockOnOpen} />)
    expect(screen.getByText("shopping")).toBeDefined()
  })

  it("renders estimated duration", () => {
    const mockOnOpen = vi.fn()
    render(<TaskCard task={mockTask} onOpenTask={mockOnOpen} />)
    expect(screen.getByText("30m")).toBeDefined()
  })

  it("calls onOpenTask when clicked", () => {
    const mockOnOpen = vi.fn()
    render(<TaskCard task={mockTask} onOpenTask={mockOnOpen} />)
    const button = screen.getByRole("button")
    fireEvent.click(button)
    expect(mockOnOpen).toHaveBeenCalledWith("task-1")
  })

  it("renders priority dots", () => {
    const mockOnOpen = vi.fn()
    render(<TaskCard task={mockTask} onOpenTask={mockOnOpen} />)
    const priorityLabel = screen.getByLabelText("Priority 2")
    expect(priorityLabel).toBeDefined()
  })

  it("handles task without description", () => {
    const taskWithoutDesc = { ...mockTask, description: undefined }
    const mockOnOpen = vi.fn()
    render(<TaskCard task={taskWithoutDesc} onOpenTask={mockOnOpen} />)
    expect(screen.queryByText("Get milk and eggs")).toBeNull()
  })

  it("handles task without category", () => {
    const taskWithoutCat = { ...mockTask, category: undefined }
    const mockOnOpen = vi.fn()
    render(<TaskCard task={taskWithoutCat} onOpenTask={mockOnOpen} />)
    expect(screen.queryByText("shopping")).toBeNull()
  })

  it("applies custom className", () => {
    const mockOnOpen = vi.fn()
    const { container } = render(
      <TaskCard task={mockTask} onOpenTask={mockOnOpen} className="custom-class" />
    )
    const button = container.querySelector("button")
    expect(button?.classList.contains("custom-class")).toBe(true)
  })
})
