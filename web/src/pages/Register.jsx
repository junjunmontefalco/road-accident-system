import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { homeFor, useAuth } from '../context/AuthContext'

/** FR-01 registration (creates a reporter account). Owner: Jan Russel */
export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ full_name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user.role)} replace />
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value })
    if (errors[k]) setErrors(({ [k]: _fixed, ...rest }) => rest)
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setMessage('')
    try {
      await register({ ...f, phone: f.phone.trim() || null })
      navigate('/home', { replace: true })
    } catch (err) {
      setErrors(err.errors || {})
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  const field = (key, label, type = 'text', extra = {}) => (
    <div className="mb-3">
      <label className="form-label" htmlFor={key}>{label}</label>
      <input id={key} type={type} className={`form-control ${errors[key] ? 'is-invalid' : ''}`} value={f[key]}
        onChange={set(key)} {...extra} />
      {errors[key] && <div className="invalid-feedback">{errors[key]}</div>}
    </div>
  )

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <Link to="/" className="text-decoration-none d-inline-block mb-3">
          <Brand />
        </Link>
        <h1 className="h4 mb-1">Create an account</h1>
        <p className="small text-secondary mb-3">You need an account so you can track your reports.</p>
        {message && !Object.keys(errors).length && <div className="alert alert-danger py-2">{message}</div>}
        {field('full_name', 'Full name', 'text', { autoComplete: 'name' })}
        {field('email', 'Email', 'email', { autoComplete: 'email' })}
        {field('phone', 'Mobile number (optional)', 'tel', { placeholder: '09XXXXXXXXX', autoComplete: 'tel' })}
        {field('password', 'Password', 'password', { autoComplete: 'new-password' })}
        {field('password_confirmation', 'Confirm password', 'password', { autoComplete: 'new-password' })}
        <button className="btn btn-guide w-100" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="small mt-3 mb-0">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
