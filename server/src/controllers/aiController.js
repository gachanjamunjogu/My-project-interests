import { parseTaskText, suggestDailyItinerary } from "../services/geminiService.js"

export async function parseTask(req, res) {
  try {
    const { text, timezone } = req.body
    console.log("AI parse request received:", { text, timezone })
    
    if (!text || typeof text !== "string") {
      console.error("Invalid text input:", text)
      return res.status(400).json({ message: "Text is required" })
    }
    
    const task = await parseTaskText({ text, timezone })
    console.log("AI parse successful:", task)
    res.json({ task })
  } catch (error) {
    // Fallback is already handled in geminiService, so this should rarely happen
    console.error("Unexpected error in parseTask:", error)
    res.status(500).json({ message: "Parse failed", error: error.message })
  }
}

export async function suggestItinerary(req, res) {
  try {
    const { dateISO, timezone, tasks } = req.body
    const itinerary = await suggestDailyItinerary({ dateISO, timezone, tasks })
    res.json(itinerary)
  } catch (error) {
    // Fallback is already handled in geminiService, so this should rarely happen
    console.error("Unexpected error in suggestItinerary:", error)
    res.status(500).json({ message: "Itinerary generation failed", error: error.message })
  }
}
