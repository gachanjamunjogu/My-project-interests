# Component Extraction Setup Guide

## Quick Start

You have **two options** to create the component files:

### Option 1: Use Node.js (Recommended)
```bash
npm run setup:components
# or directly:
node create-dirs.js
```

### Option 2: Use Python
```bash
python setup-components.py
```

Both scripts will:
1. Create the directory: `client/src/components/`
2. Create three TypeScript component files with proper exports and types

---

## Component Files Overview

### 1. TaskCard.tsx
**Location:** `client/src/components/TaskCard.tsx`

Individual task card component that displays:
- Task title and description (2-line clamp)
- Priority dots (1-5 scale)
- Category pill (if available)
- Estimated duration

**Exports:**
- `TaskStatus` type
- `Task` type
- `TaskCardProps` interface
- `TaskCard` function component

**Props:**
- `task` (Task): The task object to render
- `onOpenTask` (function): Callback when task is clicked
- `className` (optional): Additional CSS classes

---

### 2. TaskColumn.tsx
**Location:** `client/src/components/TaskColumn.tsx`

Status column component that groups tasks by status.

**Exports:**
- `TaskColumnProps` interface
- `TaskColumn` function component

**Props:**
- `status` (TaskStatus): The status for this column
- `label` (string): Display label (e.g., "In Progress")
- `tasks` (Task[]): Array of tasks in this column
- `onOpenTask` (function): Callback when a task card is clicked
- `className` (optional): Additional CSS classes

**Features:**
- Count badge showing number of tasks
- Gold gradient divider line
- Accessible aria-labels for screen readers

---

### 3. TaskBoard.tsx
**Location:** `client/src/components/TaskBoard.tsx`

Main Kanban board orchestrating all columns.

**Exports:**
- `AuraMode` type ("deep-work" | "planning" | "review")
- `TaskBoardProps` interface
- `TaskBoard` function component

**Props:**
- `tasks` (Task[]): All tasks to display
- `onOpenTask` (function): Callback when a task is opened
- `mode` (AuraMode): Current application mode
- `className` (optional): Additional CSS classes

**Features:**
- Groups tasks by status using useMemo
- Deep-work mode: Shows only "in-progress" column for focused work
- Planning/Review modes: Shows all columns (Backlog, Todo, In Progress, Review, Done)
- Horizontal scroll on mobile, grid layout on desktop

---

## Design System

All components use:
- **Color scheme:** Gold (#D4AF37) accent on dark (#0B0B0B) backgrounds
- **Styling:** Tailwind CSS with glassmorphism effects
- **Accessibility:** ARIA labels, semantic HTML, keyboard navigation
- **Utilities:** cx() for class merging, formatMinutes() for duration display

---

## TypeScript Types

All types are co-located in the component files:

```typescript
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

type AuraMode = "deep-work" | "planning" | "review"
```

---

## Next Steps

1. Run one of the setup scripts to create the component files
2. Import components in Dashboard.tsx:
   ```typescript
   import { TaskBoard, TaskBoardProps } from "./components/TaskBoard"
   import { TaskColumn, TaskColumnProps } from "./components/TaskColumn"
   import { TaskCard, TaskCardProps } from "./components/TaskCard"
   ```
3. Replace the inline `StatusColumn` function with the new `TaskColumn` component
4. Replace the inline board rendering with the new `TaskBoard` component

---

## Files Created by This Setup

- ✅ `client/src/components/TaskCard.tsx` - Individual task rendering
- ✅ `client/src/components/TaskColumn.tsx` - Status column container
- ✅ `client/src/components/TaskBoard.tsx` - Main kanban board

---

## Cleanup

After setup is complete, you can delete:
- `create-dirs.js` (setup script)
- `setup-components.py` (setup script)
- `test-node.js` (test file)
- `SETUP_GUIDE.md` (this file, optional)
