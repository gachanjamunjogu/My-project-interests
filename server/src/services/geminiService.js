const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"

function assertGeminiConfigured() {
  if (!GEMINI_API_KEY) {
    const err = new Error("GEMINI_API_KEY is not configured")
    err.code = "GEMINI_NOT_CONFIGURED"
    throw err
  }
  if (typeof fetch !== "function") {
    const err = new Error("Global fetch is not available. Use Node.js 18+.")
    err.code = "FETCH_NOT_AVAILABLE"
    throw err
  }
}

// Check if Gemini is available without throwing
function isGeminiAvailable() {
  return !!GEMINI_API_KEY && typeof fetch === "function"
}

function extractFirstJsonObject(text) {
  const firstBrace = text.indexOf("{")
  if (firstBrace === -1) return null
  let depth = 0
  for (let i = firstBrace; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === "{") depth += 1
    if (ch === "}") depth -= 1
    if (depth === 0) return text.slice(firstBrace, i + 1)
  }
  return null
}

// Fallback parser using regex patterns when Gemini is unavailable
function fallbackParseTask(text) {
  try {
    const originalText = text.trim()
    const task = {
      title: originalText,
      description: "",
    }

    // Enhanced priority detection with sentiment analysis
    const priorityPatterns = [
      { pattern: /\b(?:very high|urgent|critical|asap|emergency|immediate|crisis)\b/i, value: 5, sentiment: "extreme" },
      { pattern: /\b(?:high|important|crucial|vital|essential|priority)\b/i, value: 4, sentiment: "high" },
      { pattern: /\b(?:medium|normal|regular|standard)\b/i, value: 3, sentiment: "medium" },
      { pattern: /\b(?:low|minor|optional|nice to have)\b/i, value: 2, sentiment: "low" },
      { pattern: /\b(?:very low|trivial|whenever|someday)\b/i, value: 1, sentiment: "minimal" },
    ]
    
    // Detect urgency through keywords and context
    let detectedPriority = 3
    let priorityReason = ""
    for (const { pattern, value, sentiment } of priorityPatterns) {
      if (pattern.test(text)) {
        detectedPriority = value
        priorityReason = `Detected ${sentiment} priority`
        task.title = task.title.replace(pattern, '').trim()
        break
      }
    }

    // Context-aware priority adjustment
    if (detectedPriority === 3) {
      const urgencyIndicators = [
        /\b(?:need to|must|should|have to)\b/i,
        /\b(?:deadline|due|by)\b/i,
        /\b(?:today|tomorrow|this week)\b/i,
        /\b(?:as soon as possible|right now)\b/i,
      ]
      for (const indicator of urgencyIndicators) {
        if (indicator.test(text)) {
          detectedPriority = 4
          priorityReason = "Detected urgency indicators"
          break
        }
      }
    }

    task.priority = detectedPriority

    // Enhanced category detection with subcategories
    const categoryMap = {
      work: {
        patterns: [/\b(?:work|office|job|career|business|professional)\b/i],
        subcategories: {
          meeting: [/\b(?:meeting|call|conference|standup|sync)\b/i],
          email: [/\b(?:email|message|reply|respond)\b/i],
          presentation: [/\b(?:presentation|slide|deck|pitch)\b/i],
          report: [/\b(?:report|document|write|draft)\b/i],
          project: [/\b(?:project|task|deliverable)\b/i],
          admin: [/\b(?:admin|paperwork|documentation)\b/i],
        }
      },
      personal: {
        patterns: [/\b(?:personal|home|family|health|wellness|self)\b/i],
        subcategories: {
          health: [/\b(?:health|doctor|dentist|exercise|gym|medication)\b/i],
          family: [/\b(?:family|kids|spouse|parent|relative)\b/i],
          home: [/\b(?:home|house|clean|repair|maintenance)\b/i],
          social: [/\b(?:social|friend|party|event|gathering)\b/i],
        }
      },
      shopping: {
        patterns: [/\b(?:shopping|buy|purchase|store|order)\b/i],
        subcategories: {
          grocery: [/\b(?:grocery|food|supermarket|market)\b/i],
          electronics: [/\b(?:electronics|tech|gadget|device)\b/i],
          clothing: [/\b(?:clothing|clothes|shoes|apparel)\b/i],
          home: [/\b(?:furniture|decor|home goods)\b/i],
        }
      },
      learning: {
        patterns: [/\b(?:learning|study|course|reading|education|skill)\b/i],
        subcategories: {
          course: [/\b(?:course|class|tutorial|lesson)\b/i],
          reading: [/\b(?:reading|book|article|blog)\b/i],
          practice: [/\b(?:practice|exercise|homework|assignment)\b/i],
          research: [/\b(?:research|investigate|explore)\b/i],
        }
      },
      finance: {
        patterns: [/\b(?:finance|budget|bill|payment|money|financial)\b/i],
        subcategories: {
          bill: [/\b(?:bill|invoice|payment)\b/i],
          budget: [/\b(?:budget|expense|spending)\b/i],
          investment: [/\b(?:investment|stock|crypto)\b/i],
          savings: [/\b(?:savings|deposit|bank)\b/i],
        }
      },
      creative: {
        patterns: [/\b(?:creative|design|art|write|create|content)\b/i],
        subcategories: {
          design: [/\b(?:design|graphic|ui|ux)\b/i],
          writing: [/\b(?:write|blog|content|copy)\b/i],
          art: [/\b(?:art|draw|paint|sketch)\b/i],
          music: [/\b(?:music|song|compose)\b/i],
        }
      },
      health: {
        patterns: [/\b(?:exercise|workout|fitness|diet|nutrition)\b/i],
        subcategories: {
          workout: [/\b(?:workout|exercise|gym|training)\b/i],
          diet: [/\b(?:diet|nutrition|meal|cooking)\b/i],
          mental: [/\b(?:meditation|mindfulness|therapy)\b/i],
        }
      },
      travel: {
        patterns: [/\b(?:travel|trip|vacation|journey)\b/i],
        subcategories: {
          planning: [/\b(?:plan|book|reserve)\b/i],
          packing: [/\b(?:pack|luggage|prepare)\b/i],
        }
      }
    }

    let detectedCategory = null
    let detectedSubcategory = null

    for (const [category, data] of Object.entries(categoryMap)) {
      for (const pattern of data.patterns) {
        if (pattern.test(text)) {
          detectedCategory = category
          task.title = task.title.replace(pattern, '').trim()
          
          // Check for subcategories
          for (const [subcat, patterns] of Object.entries(data.subcategories)) {
            for (const subpattern of patterns) {
              if (subpattern.test(text)) {
                detectedSubcategory = subcat
                task.title = task.title.replace(subpattern, '').trim()
                break
              }
            }
            if (detectedSubcategory) break
          }
          break
        }
      }
      if (detectedCategory) break
    }

    if (detectedCategory) {
      task.category = detectedSubcategory ? `${detectedCategory}/${detectedSubcategory}` : detectedCategory
    }

    // Enhanced duration detection with time ranges
    const durationPatterns = [
      { pattern: /(\d+)\s*hours?/i, multiplier: 60 },
      { pattern: /(\d+)\s*hrs?/i, multiplier: 60 },
      { pattern: /(\d+)\s*h\b/i, multiplier: 60 },
      { pattern: /(\d+)\s*minutes?/i, multiplier: 1 },
      { pattern: /(\d+)\s*mins?/i, multiplier: 1 },
      { pattern: /(\d+)\s*m\b/i, multiplier: 1 },
      { pattern: /half an hour/i, value: 30 },
      { pattern: /quarter hour/i, value: 15 },
      { pattern: /couple of hours/i, value: 120 },
      { pattern: /few hours/i, value: 180 },
      { pattern: /short (?:task|meeting|call)/i, value: 30 },
      { pattern: /long (?:task|meeting|call)/i, value: 90 },
    ]
    
    for (const { pattern, multiplier, value } of durationPatterns) {
      const match = text.match(pattern)
      if (match) {
        task.estimatedDurationMin = value || (multiplier ? parseInt(match[1]) * multiplier : null)
        task.title = task.title.replace(pattern, '').trim()
        break
      }
    }

    // Smart duration estimation based on category
    if (!task.estimatedDurationMin && detectedCategory) {
      const categoryDurations = {
        meeting: 60,
        call: 30,
        email: 15,
        presentation: 90,
        report: 120,
        workout: 45,
        reading: 30,
        shopping: 60,
        cooking: 30,
        cleaning: 45,
      }
      
      for (const [key, duration] of Object.entries(categoryDurations)) {
        if (text.toLowerCase().includes(key)) {
          task.estimatedDurationMin = duration
          break
        }
      }
    }

    // Enhanced date/time parsing
    const datePatterns = [
      { pattern: /\btoday\b/i, handler: () => {
        const date = new Date()
        return date.toISOString()
      }},
      { pattern: /\btomorrow\b/i, handler: () => {
        const date = new Date()
        date.setDate(date.getDate() + 1)
        return date.toISOString()
      }},
      { pattern: /\bnext week\b/i, handler: () => {
        const date = new Date()
        date.setDate(date.getDate() + 7)
        return date.toISOString()
      }},
      { pattern: /\bthis week\b/i, handler: () => {
        const date = new Date()
        date.setDate(date.getDate() + 3)
        return date.toISOString()
      }},
      { pattern: /\bnext month\b/i, handler: () => {
        const date = new Date()
        date.setMonth(date.getMonth() + 1)
        return date.toISOString()
      }},
      { pattern: /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, handler: (match) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const targetDay = match[0].toLowerCase()
        const today = new Date()
        const currentDay = today.getDay()
        const targetIndex = days.indexOf(targetDay)
        
        let daysUntil = targetIndex - currentDay
        if (daysUntil <= 0) {
          daysUntil += 7
        }
        
        const date = new Date()
        date.setDate(date.getDate() + daysUntil)
        return date.toISOString()
      }},
      { pattern: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i, handler: (match) => {
        const [, month, day, year] = match
        const fullYear = year.length === 2 ? `20${year}` : year
        const date = new Date(`${fullYear}-${month}-${day}`)
        return date.toISOString()
      }},
      { pattern: /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})?/i, handler: (match) => {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        const [, day, monthStr, year] = match
        const monthIndex = months.findIndex(m => monthStr.toLowerCase().startsWith(m))
        const fullYear = year || new Date().getFullYear()
        const date = new Date(fullYear, monthIndex, parseInt(day))
        return date.toISOString()
      }},
    ]

    for (const { pattern, handler } of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        task.dueAt = handler(match)
        task.title = task.title.replace(pattern, '').trim()
        break
      }
    }

    // Time-specific parsing (for today/tomorrow)
    const timePatterns = [
      { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)?/i, handler: (match) => {
        const [, hours, minutes, meridiem] = match
        let hour = parseInt(hours)
        if (meridiem?.toLowerCase() === 'pm' && hour !== 12) hour += 12
        if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0
        return { hour, minute: parseInt(minutes) }
      }},
      { pattern: /(\d{1,2})\s*(am|pm)/i, handler: (match) => {
        const [, hours, meridiem] = match
        let hour = parseInt(hours)
        if (meridiem.toLowerCase() === 'pm' && hour !== 12) hour += 12
        if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0
        return { hour, minute: 0 }
      }},
    ]

    for (const { pattern, handler } of timePatterns) {
      const match = text.match(pattern)
      if (match) {
        const time = handler(match)
        const date = new Date()
        date.setHours(time.hour, time.minute, 0, 0)
        
        // If time is in the past, assume tomorrow
        if (date < new Date()) {
          date.setDate(date.getDate() + 1)
        }
        
        task.dueAt = date.toISOString()
        task.title = task.title.replace(pattern, '').trim()
        break
      }
    }

    // Enhanced status detection
    const statusPatterns = [
      { pattern: /\b(?:backlog|later|someday|eventually|when possible)\b/i, value: "backlog" },
      { pattern: /\b(?:todo|do|task|need to|should)\b/i, value: "todo" },
      { pattern: /\b(?:in progress|doing|working on|currently|right now)\b/i, value: "in-progress" },
      { pattern: /\b(?:review|check|verify|validate|test)\b/i, value: "review" },
      { pattern: /\b(?:done|complete|finished|completed|accomplished)\b/i, value: "done" },
    ]
    for (const { pattern, value } of statusPatterns) {
      if (pattern.test(text)) {
        task.status = value
        task.title = task.title.replace(pattern, '').trim()
        break
      }
    }

    // Smart description generation
    const extractedInfo = []
    if (detectedCategory) extractedInfo.push(`Category: ${task.category}`)
    if (task.estimatedDurationMin) extractedInfo.push(`Duration: ${task.estimatedDurationMin} minutes`)
    if (priorityReason) extractedInfo.push(priorityReason)
    
    // Add context from original text
    const contextWords = text.split(/\s+/).filter(word => word.length > 3)
    if (contextWords.length > 2) {
      extractedInfo.push(`Context: "${originalText}"`)
    }

    if (extractedInfo.length > 0) {
      task.description = extractedInfo.join(". ")
    }

    // Clean up title
    task.title = task.title.replace(/\s+/g, ' ').trim()
    
    // If title is empty after extraction, use original text
    if (!task.title || task.title.length < 3) {
      task.title = originalText
    }

    // Capitalize title properly
    task.title = task.title.charAt(0).toUpperCase() + task.title.slice(1)

    const result = normalizeTaskCreate(task)
    
    // Add AI metadata
    result.ai = {
      source: "fallback-parser",
      confidence: 0.85,
      parsedFields: Object.keys(result).filter(k => k !== 'title' && result[k] !== undefined),
    }

    return result
  } catch (error) {
    console.error("Fallback parser error:", error)
    // Return a minimal task object if parsing fails
    return {
      title: text.trim(),
      status: "todo",
      priority: 3,
      ai: {
        source: "fallback-parser",
        confidence: 0.5,
      }
    }
  }
}

async function geminiGenerateText({ system, user }) {
  assertGeminiConfigured()

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent`
  )
  url.searchParams.set("key", GEMINI_API_KEY)

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${system}\n\n${user}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 512,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const err = new Error(`Gemini request failed: ${res.status} ${body}`)
    err.code = "GEMINI_HTTP_ERROR"
    throw err
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n")
  return text || ""
}

function normalizeTaskCreate(proposed) {
  if (!proposed || typeof proposed !== "object") return null

  const title = typeof proposed.title === "string" ? proposed.title.trim() : ""
  if (!title) return null

  const task = {
    title,
    description: typeof proposed.description === "string" ? proposed.description.trim() : undefined,
    status: typeof proposed.status === "string" ? proposed.status : undefined,
    priority: Number.isInteger(proposed.priority) ? proposed.priority : undefined,
    category: typeof proposed.category === "string" ? proposed.category.trim() : undefined,
    estimatedDurationMin: Number.isFinite(proposed.estimatedDurationMin)
      ? Math.max(0, Math.round(proposed.estimatedDurationMin))
      : undefined,
    dueAt: typeof proposed.dueAt === "string" ? proposed.dueAt : undefined,
  }

  Object.keys(task).forEach((k) => (task[k] === undefined ? delete task[k] : null))
  return task
}

export async function parseTaskText({ text, timezone }) {
  // Use fallback immediately if Gemini is not configured
  if (!isGeminiAvailable()) {
    console.warn("Gemini not configured, using fallback parser")
    return fallbackParseTask(text)
  }

  const system = [
    "You are an assistant that converts natural language into a JSON task object.",
    "Return JSON only.",
    "Schema:",
    "{",
    '  "title": string,',
    '  "description"?: string,',
    '  "status"?: "backlog" | "todo" | "in-progress" | "review" | "done",',
    '  "priority"?: 1 | 2 | 3 | 4 | 5,',
    '  "category"?: string,',
    '  "estimatedDurationMin"?: number,',
    '  "dueAt"?: string (ISO-8601),',
    "}",
    "If date/time is ambiguous, omit dueAt and add detail to description instead.",
  ].join("\n")

  const user = [
    `Timezone: ${timezone || "unspecified"}`,
    "Input:",
    text,
  ].join("\n")

  try {
    const raw = await geminiGenerateText({ system, user })
    const json = extractFirstJsonObject(raw) ?? raw.trim()
    const parsed = JSON.parse(json)
    return normalizeTaskCreate(parsed)
  } catch (error) {
    // Fallback to regex-based parsing when Gemini is unavailable
    console.warn("Gemini unavailable, using fallback parser:", error.message)
    return fallbackParseTask(text)
  }
}

export async function suggestDailyItinerary({ dateISO, timezone, tasks }) {
  // Use fallback immediately if Gemini is not configured
  if (!isGeminiAvailable()) {
    console.warn("Gemini not configured, using fallback itinerary")
    return generateFallbackItinerary({ tasks })
  }

  const system = [
    "You are an assistant that proposes a focused daily itinerary from a list of tasks.",
    "Do not modify tasks. Only propose an ordered plan the user can accept or reject.",
    "Return JSON only.",
    "Schema:",
    "{",
    '  "suggestions": [',
    "    {",
    '      "taskId"?: string,',
    '      "title": string,',
    '      "startTime"?: string (HH:mm),',
    '      "durationMin"?: number,',
    '      "reason"?: string',
    "    }",
    "  ],",
    '  "rationale"?: string',
    "}",
    "Prefer 60-120 minute deep work blocks, add short breaks, and keep total load realistic.",
  ].join("\n")

  const user = JSON.stringify(
    {
      dateISO,
      timezone: timezone || "unspecified",
      tasks: (tasks || []).map((t) => ({
        id: t._id || t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: t.category,
        estimatedDurationMin: t.estimatedDurationMin,
        dueAt: t.dueAt,
      })),
    },
    null,
    0
  )

  try {
    const raw = await geminiGenerateText({ system, user })
    const json = extractFirstJsonObject(raw) ?? raw.trim()
    const parsed = JSON.parse(json)
    return {
      suggestions: Array.isArray(parsed?.suggestions) ? parsed.suggestions : [],
      rationale: typeof parsed?.rationale === "string" ? parsed.rationale : undefined,
    }
  } catch (error) {
    // Fallback to simple priority-based ordering when Gemini is unavailable
    console.warn("Gemini unavailable, using fallback itinerary:", error.message)
    return generateFallbackItinerary({ tasks })
  }
}

function generateFallbackItinerary({ tasks }) {
  const sortedTasks = (tasks || [])
    .filter(t => t.status !== "done")
    .sort((a, b) => {
      // Sort by priority (higher first), then by due date
      if (b.priority !== a.priority) return b.priority - a.priority
      if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      if (a.dueAt) return -1
      if (b.dueAt) return 1
      return 0
    })

  let currentTime = 9 * 60 // Start at 9:00 AM
  const suggestions = sortedTasks.slice(0, 5).map((task, index) => {
    const duration = task.estimatedDurationMin || 60
    const startTime = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`
    currentTime += duration + 15 // Add 15 min break between tasks
    return {
      taskId: task._id || task.id,
      title: task.title,
      startTime,
      durationMin: duration,
      reason: `Priority ${task.priority} task`,
    }
  })

  return {
    suggestions,
    rationale: "Tasks ordered by priority and due date (AI unavailable, using fallback)",
  }
}

