import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { connectDatabase } from "./config/db.js"
import authRoutes from "./routes/auth.js"
import taskRoutes from "./routes/tasks.js"
import aiRoutes from "./routes/ai.js"

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  "http://localhost:4173",
  "http://localhost:4174",
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/ai", aiRoutes)

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV || "development" })
})

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`AURA server running on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error("Database connection failed", err)
    process.exit(1)
  })
