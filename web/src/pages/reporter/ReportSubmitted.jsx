import { Link, useLocation, useParams } from 'react-router-dom'

/** Submission confirmation with the report ID. Owner: Jan Russel */
export default function ReportSubmitted() {
  const { id } = useParams()
  const { state } = useLocation()
  const report = state?.report

  return (
    <div className="form-page text-center">
      <div className="panel py-5">
        <h1 className="h3">Report sent</h1>
        <p className="text-secondary">Keep this ID. You can use it to follow your report.</p>
        {report && <p className="report-code-big">{report.report_code}</p>}
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <Link to={`/reports/${id}`} className="btn btn-guide">View report status</Link>
          <Link to="/home" className="btn btn-outline-secondary">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
