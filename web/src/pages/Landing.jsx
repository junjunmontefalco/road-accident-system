import { Link, Navigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { homeFor, useAuth } from '../context/AuthContext'

/** Public landing page. Owner: Jan Russel */
export default function Landing() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to={homeFor(user.role)} replace />

  return (
    <div className="landing">
      <header className="container d-flex justify-content-between align-items-center py-3">
        <Brand light />
        <Link to="/login" className="btn btn-sm btn-outline-light">
          Log in
        </Link>
      </header>
      <section className="container landing-hero">
        <h1>Saw a road accident in Bulacan? Report it here.</h1>
        <p className="lead">
          Send the place, time and photos in a few minutes. Traffic authorities review every report, and you can
          follow its status until the case is closed.
        </p>
        <div className="d-flex flex-wrap gap-3 mt-4">
          <Link to="/register" className="btn btn-report btn-lg">
            Report an accident
          </Link>
          <Link to="/login" className="btn btn-lg btn-outline-light">
            Track my report
          </Link>
        </div>
        <p className="small text-white-50 mt-4 mb-0">
          In an emergency, call 911 first. This system is for reporting, not for dispatching help.
        </p>
      </section>
      <div className="lane-line" aria-hidden="true" />
      <section className="landing-steps">
        <div className="container">
          <ol className="steps">
            <li>
              <h2 className="h6">Describe what happened</h2>
              <p>Date, time, type of accident, vehicles and injuries.</p>
            </li>
            <li>
              <h2 className="h6">Pin the location</h2>
              <p>Use your phone's GPS or tap the spot on the map.</p>
            </li>
            <li>
              <h2 className="h6">Add photos and send</h2>
              <p>You get a report ID right away, and a notice each time the status changes.</p>
            </li>
          </ol>
        </div>
      </section>
    </div>
  )
}
