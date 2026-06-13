import api from "./api"

type Credentials = {
  email: string
  password: string
}

type RegisterInput = Credentials & {
  name?: string
}

export async function login(input: Credentials) {
  const response = await api.post("/auth/login", input)
  return response.data
}

export async function register(input: RegisterInput) {
  const response = await api.post("/auth/register", input)
  return response.data
}

export async function refreshAuth() {
  const response = await api.post("/auth/refresh")
  return response.data
}

export async function logout() {
  const response = await api.post("/auth/logout")
  return response.data
}
