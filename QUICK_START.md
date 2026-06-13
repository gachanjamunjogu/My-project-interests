# Component Extraction - Quick Start Guide

## ✅ What's Been Created

I've prepared **THREE REUSABLE REACT COMPONENTS** for you extracted from Dashboard.tsx:

### Component Files (Ready to Create):
1. **TaskCard.tsx** - Individual task rendering
   - Displays title, description (2-line clamp), priority dots, category, duration
   - Handles onClick to open task details
   - Includes GoldPill and PriorityDots utility components

2. **TaskColumn.tsx** - Status column container  
   - Groups tasks by status (backlog, todo, in-progress, review, done)
   - Displays column header with task count badge
   - Renders multiple TaskCard components
   - Gradient divider with gold accent

3. **TaskBoard.tsx** - Main kanban board
   - Groups all tasks by status
   - Deep-work mode: shows only in-progress column
   - Planning/Review modes: shows all columns
   - Memoized grouping for performance

---

## 🚀 Setup Instructions (Choose ONE)

### **Option 1: Using npm (Recommended)**
```bash
npm run setup:components
```
✓ Fastest  
✓ Works automatically on `npm install`  

### **Option 2: Using Node.js directly**
```bash
node create-dirs.js
```

### **Option 3: Using Python**
```bash
python setup-components.py
```

### **Option 4: Using Bash (Mac/Linux)**
```bash
bash setup.sh
```

### **Option 5: Using Windows CMD**
```cmd
setup-windows.cmd
```

---

## 📁 Output Structure

After running any setup script, you'll have:
```
client/src/
├── components/          ← NEW
│   ├── TaskCard.tsx
│   ├── TaskColumn.tsx
│   └── TaskBoard.tsx
├── pages/
├── features/
├── services/
└── ...
```

---

## 📦 Files Included

- `create-dirs.js` - Node.js setup script (self-contained)
- `setup-components.py` - Python setup script (self-contained)
- `setup.sh` - Bash setup script for Mac/Linux
- `setup-windows.cmd` - Windows CMD setup script  
- `package.json` - Updated with npm scripts and postinstall hook
- `SETUP_GUIDE.md` - Detailed documentation
- `QUICK_START.md` - This file

---

## 📝 Component Details

### TaskCard.tsx
```typescript
export interface TaskCardProps {
  task: Task
  onOpenTask: (id: string) => void
  className?: string
}
```

### TaskColumn.tsx
```typescript
export interface TaskColumnProps {
  status: TaskStatus
  label: string
  tasks: Task[]
  onOpenTask: (id: string) => void
  className?: string
}
```

### TaskBoard.tsx
```typescript
export interface TaskBoardProps {
  tasks: Task[]
  onOpenTask: (id: string) => void
  mode: AuraMode
  className?: string
}
```

---

## 🎨 Design System

- **Color**: Gold (#D4AF37) on dark backgrounds (#0B0B0B)
- **Framework**: Tailwind CSS + glassmorphism
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- **Utilities**: cx() for className merging, formatMinutes() for duration

---

## ✨ Key Features

✅ Reusable components with proper TypeScript types  
✅ Accessible HTML (aria-labels, roles, semantic elements)  
✅ Consistent styling with golden color scheme  
✅ Priority indicators using dot visualization  
✅ Responsive layout (mobile scroll, desktop grid)  
✅ Deep-work mode support (focus on in-progress)  
✅ Automatic task grouping by status  
✅ Clean prop interfaces  

---

## 🔄 Auto-Setup via npm install

The setup will **automatically run** when you do:
```bash
npm install
```

This is thanks to the `postinstall` script we added to package.json.

---

## 🧹 Cleanup (Optional)

After running setup, you can delete the setup scripts:
```bash
rm create-dirs.js setup-components.py setup.sh setup-windows.cmd
```

Or keep them for re-running in the future.

---

## 📚 Next Steps

1. **Run ONE of the setup commands** to create the component files
2. **Check** that `client/src/components/` directory exists with 3 files
3. **In the next session**, I'll help you integrate these into Dashboard.tsx

---

**That's it! 🎉** The components are ready to use once created.
