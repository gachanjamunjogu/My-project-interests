import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { User } from "../models/User.js"
import { RefreshToken } from "../models/RefreshToken.js"

const ACCESS_TOKEN_EXPIRES_IN = "15m"
const REFRESH_TOKEN_EXPIRES_IN = "7d"

function signAccessToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not configured")
  return jwt.sign({ sub: user._id, email: user.email }, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  })
}

function signRefreshToken(user) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured")
  return jwt.sign({ sub: user._id }, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  })
}

async function createRefreshTokenRecord(user, token, req) {
  const tokenHash = await bcrypt.hash(token, 10)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  })
}

function sendLoginResponse(res, accessToken, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.json({ accessToken })
}

export async function register(req, res) {
  const { email, password, name } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    return res.status(409).json({ message: "Email already registered" })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ email: email.toLowerCase().trim(), passwordHash, name })

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)
  await createRefreshTokenRecord(user, refreshToken, req)

  sendLoginResponse(res, accessToken, refreshToken)
}

export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" })
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" })
  }

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)
  await createRefreshTokenRecord(user, refreshToken, req)

  sendLoginResponse(res, accessToken, refreshToken)
}

export async function refreshToken(req, res) {
  const token = req.cookies?.refreshToken || req.body?.refreshToken
  if (!token) {
    return res.status(401).json({ message: "Refresh token required" })
  }

  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured")
  }

  let payload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" })
  }

  const user = await User.findById(payload.sub)
  if (!user) {
    return res.status(401).json({ message: "User not found" })
  }

  const tokenRecord = await RefreshToken.findOne({ userId: user._id }).sort({ createdAt: -1 })
  if (!tokenRecord) {
    return res.status(401).json({ message: "Refresh token not found" })
  }

  const validToken = await bcrypt.compare(token, tokenRecord.tokenHash)
  if (!validToken) {
    return res.status(401).json({ message: "Refresh token invalid" })
  }

  const accessToken = signAccessToken(user)
  const refresh = signRefreshToken(user)
  tokenRecord.revokedAt = new Date()
  tokenRecord.replacedByTokenHash = await bcrypt.hash(refresh, 10)
  await tokenRecord.save()
  await createRefreshTokenRecord(user, refresh, req)

  sendLoginResponse(res, accessToken, refresh)
}

export async function logout(req, res) {
  const token = req.cookies?.refreshToken
  if (token) {
    const records = await RefreshToken.find().sort({ createdAt: -1 })
    for (const record of records) {
      if (await bcrypt.compare(token, record.tokenHash)) {
        record.revokedAt = new Date()
        await record.save()
        break
      }
    }
  }
  res.clearCookie("refreshToken")
  res.json({ loggedOut: true })
}
