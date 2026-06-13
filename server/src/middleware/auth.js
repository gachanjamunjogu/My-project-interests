import jwt from "jsonwebtoken"
import { User } from "../models/User.js"

export async function authGuard(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error("JWT_SECRET is not configured")
    }

    const payload = jwt.verify(token, secret)
    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = { id: user._id, email: user.email }
    next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" })
  }
}
