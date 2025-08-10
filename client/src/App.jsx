import React from 'react'
import DocumentsTable from './components/DocumentsTable.jsx'
import Calendar from './components/Calendar.jsx'

export default function App() {
  return (
    <div>
      <header>
        <div className="container">
          <h1>PACT - Tiny Experiments</h1>
          <p className="muted">Purposeful, Actionable, Continuous, Trackable</p>
        </div>
      </header>
      <main>
        <div className="container">
          <Calendar />
          <DocumentsTable />
        </div>
      </main>
    </div>
  )
}
