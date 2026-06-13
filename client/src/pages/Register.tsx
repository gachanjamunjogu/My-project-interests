import { FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAppDispatch } from "../app/hooks"
import { register } from "../services/authService"
import { setCredentials, setError, setLoading } from "../features/auth/authSlice"
import { setAuthorizationToken } from "../services/api"

export default function Register() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    dispatch(setLoading())

    try {
      const data = await register({ name, email, password })
      if (data?.accessToken) {
        dispatch(setCredentials({ accessToken: data.accessToken }))
        setAuthorizationToken(data.accessToken)
        localStorage.setItem("aura_access_token", data.accessToken)
        navigate("/")
      } else {
        throw new Error("Missing access token")
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Unable to register"
      dispatch(setError(message))
      setMessage(message)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#0B0B0B]/80 p-8 shadow-aura">
        <div className="mb-6 text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-[#D4AF37]/90">AURA</div>
          <h1 className="mt-4 text-3xl font-semibold text-white">Create your account</h1>
          <p className="mt-2 text-base text-white/60">Start building an AI-driven task routine.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-base font-medium text-white/80">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-black/30 px-5 py-3.5 text-base text-white outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
            />
          </label>

          <label className="block text-base font-medium text-white/80">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-white/10 bg-black/30 px-5 py-3.5 text-base text-white outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
            />
          </label>

          <label className="block text-base font-medium text-white/80">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-white/10 bg-black/30 px-5 py-3.5 text-base text-white outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
            />
          </label>

          {message ? <div className="rounded-2xl bg-[#550000]/30 px-4 py-3 text-base text-rose-300">{message}</div> : null}

          <button
            type="submit"
            className="w-full rounded-3xl bg-[#D4AF37] px-5 py-3.5 text-base font-semibold text-black transition hover:bg-[#C5A021]"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-base text-white/60">
          Already a member?{' '}
          <Link to="/login" className="font-semibold text-[#D4AF37] hover:text-[#C5A021]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
