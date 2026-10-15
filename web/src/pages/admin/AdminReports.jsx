import ReportsTable from '../../components/ReportsTable'

/** FR-07, FR-11 report management. Owner: Vince */
export default function AdminReports() {
  return (
    <div>
      <h1 className="h3 mb-3">Accident reports</h1>
      <ReportsTable />
    </div>
  )
}
