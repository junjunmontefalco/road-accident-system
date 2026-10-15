/**
 * Placeholder for a page or section a member still has to build.
 * Delete it once the real page exists.
 */
export default function TodoPanel({ title, owner, requirement, items = [] }) {
  return (
    <section className="todo-panel">
      <h2 className="h5 mb-1">{title}</h2>
      <p className="small mb-2">
        To build: <strong>{owner}</strong>
        {requirement && <> for {requirement}</>}
      </p>
      {items.length > 0 && (
        <ul className="mb-0">
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
