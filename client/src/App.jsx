import React from 'react'
import DocumentsTable from './components/DocumentsTable.jsx'
import Calendar from './components/Calendar.jsx'
import AnalogueClock from './components/AnalogueClock.jsx'
import DigitalClock from './components/DigitalClock.jsx'

export default function App() {
  return (
    <div>
      <header>
        <div className="container header-row">
          <div>
            <h1>PACT - Tiny Experiments</h1>
            <p className="muted">Purposeful, Actionable, Continuous, Trackable</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
            <AnalogueClock size={72} />
            <DigitalClock style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }} />
          </div>
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
