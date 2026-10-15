import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { homeFor, useAuth } from '../context/AuthContext'

/** FR-02 login. Owner: Jan Russel */
export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(email.trim(), password)
      navigate(location.state?.from && u.role === 'reporter' ? location.state.from : homeFor(u.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <Link to="/" className="text-decoration-none d-inline-block mb-3">
          <Brand />
        </Link>
        <h1 className="h4 mb-3">Log in</h1>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="form-control" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-guide w-100" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="small mt-3 mb-0">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  )
}
