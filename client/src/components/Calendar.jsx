import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function getMonthMatrix(baseDate = new Date()) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth() // 0..11
  const firstOfMonth = new Date(year, month, 1)
  const startDay = (firstOfMonth.getDay() + 6) % 7 // make Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  // Fill leading blanks
  for (let i = 0; i < startDay; i++) cells.push(null)
  // Fill days
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // Pad to complete the last week only
  while (cells.length % 7 !== 0) cells.push(null)

  // Chunk into weeks
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function Calendar({ date }) {
  const [viewDate, setViewDate] = useState(() => {
    const baseDate = date || new Date()
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  })
  const monthName = viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const weeks = useMemo(() => getMonthMatrix(viewDate), [viewDate])
  const todayKey = new Date().toDateString()

  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false

    async function reload() {
      try {
        const r = await fetch(`${API_BASE}/pacts?limit=100&sort=desc`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      } catch {
        // ignore for calendar
      }
    }

    // initial load
    reload()

    // listen for cross-component updates
    const onChanged = () => { reload() }
    if (typeof window !== 'undefined') {
      window.addEventListener('pacts-changed', onChanged)
    }

    return () => {
      cancelled = true
      if (typeof window !== 'undefined') {
        window.removeEventListener('pacts-changed', onChanged)
      }
    }
  }, [])

  const itemsByDay = useMemo(() => {
    const map = new Map()
    for (const it of items) {
      if (!it || !it.date) continue
      const d = new Date(it.date)
      if (isNaN(d.getTime())) continue
      const key = d.toDateString()
      const arr = map.get(key) || []
      arr.push(it)
      map.set(key, arr)
    }
    return map
  }, [items])

  // Sync viewDate if parent prop changes (only when date prop is actually provided)
  useEffect(() => {
    if (!date || !(date instanceof Date)) return
    const newViewDate = new Date(date.getFullYear(), date.getMonth(), 1)
    setViewDate(prevViewDate => {
      // Only update if the month/year actually changed
      if (prevViewDate.getFullYear() !== newViewDate.getFullYear() || 
          prevViewDate.getMonth() !== newViewDate.getMonth()) {
        return newViewDate
      }
      return prevViewDate
    })
  }, [date?.getTime()]) // Use getTime() to avoid reference comparison issues

  const monthValue = useMemo(() => `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`, [viewDate])
  const goPrev = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const goNext = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const goToday = () => {
    const now = new Date()
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }
  const onMonthChange = (e) => {
    const val = e.target.value
    if (!val) return
    const [y, m] = val.split('-')
    const yy = Number(y)
    const mm = Number(m)
    if (!isNaN(yy) && !isNaN(mm) && mm >= 1 && mm <= 12) {
      setViewDate(new Date(yy, mm - 1, 1))
    }
  }

  return (
    <section aria-label="Activity calendar" style={{ marginBottom: '1rem' }}>
      <div className="toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="label-text" style={{ textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--text-muted)' }}>Calendar</div>
          <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.1rem' }}>{monthName}</h2>
        </div>
        <div className="toolbar" style={{ gap: '0.5rem', background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <button className="btn" aria-label="Previous month" onClick={goPrev}>&lt;</button>
          <input
            type="month"
            className="input"
            aria-label="Select month"
            value={monthValue}
            onChange={onMonthChange}
            style={{ minWidth: '140px' }}
          />
          <button className="btn" aria-label="Next month" onClick={goNext}>&gt;</button>
          <button className="btn" onClick={goToday} title="Jump to current month">Today</button>
        </div>
      </div>

      <div className="calendar" role="grid" aria-label={monthName}>
        <div className="calendar-row calendar-head" role="row">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
            <div key={d} role="columnheader" className="calendar-cell calendar-head-cell">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="calendar-row" role="row">
            {week.map((cell, ci) => {
              if (!cell) return <div key={ci} className="calendar-cell calendar-empty" role="gridcell" aria-disabled="true" />
              const isToday = cell.toDateString() === todayKey
              const day = cell.getDate()
              // As requested previously, indicate there's activity on all days
              const hasActivity = true
              const pacts = itemsByDay.get(cell.toDateString()) || []
              const allNames = pacts.map(p => p && p.name).filter(Boolean)

              // Map category to a consistent color
              const catColor = (cat) => {
                if (!cat) return '#8892a6'
                const preset = {
                  work: '#4f46e5',
                  personal: '#10b981',
                  health: '#00ff00',
                  finance: '#f59e0b',
                  learning: '#06b6d4',
                  other: '#8b5cf6',
                }
                const key = String(cat).trim().toLowerCase()
                if (preset[key]) return preset[key]
                // fallback: simple hash to color
                let h = 0
                for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
                const hue = h % 360
                return `hsl(${hue}, 65%, 55%)`
              }

              return (
                <div
                  key={ci}
                  role="gridcell"
                  className={`calendar-cell${isToday ? ' is-today' : ''}${hasActivity ? ' has-activity' : ''}`}
                  aria-label={`${cell.toLocaleDateString()} - ${allNames.length ? 'Pacts: ' + allNames.join(', ') : 'No pacts'}`}
                >
                  <span className="calendar-day">{day}</span>
                  {pacts.length > 0 && (
                    <div className="pact-list" title={allNames.join(', ')}>
                      {pacts.map((p, idx) => (
                        <div key={idx} className="pact-item">
                          <span className="category-dot" style={{ backgroundColor: catColor(p.category) }} aria-hidden="true" />
                          <span className="pact-name">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasActivity && <span className="activity-dot" aria-hidden="true" />}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <style>{`
        .calendar {
          display: grid;
          gap: 4px;
          background: linear-gradient(180deg, var(--panel), var(--panel-2));
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 6px;
        }
        .calendar-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
        }
        .calendar-head {
          position: sticky;
          top: 56px; /* below header */
          z-index: 1;
          background: linear-gradient(180deg, rgba(10,16,22,0.9), rgba(10,16,22,0.6));
          padding: 4px 0;
          border-bottom: 1px solid var(--border);
          border-radius: 8px;
        }
        .calendar-cell {
          position: relative;
          aspect-ratio: 1 / 1;
          min-height: 44px;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 4px;
          background: #0b121a;
          overflow: hidden;
        }
        .calendar-head-cell {
          background: transparent;
          border: none;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 12px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: unset;
          aspect-ratio: auto;
          padding: 4px 0;
        }
        .calendar-empty { opacity: 0.35; background: transparent; border-style: dashed; }
        .calendar-day {
          font-weight: 600;
          color: var(--text);
          font-size: 0.8rem;
        }
        .pact-list {
          margin-top: 2px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          max-height: calc(100% - 18px);
          overflow: hidden;
        }
        .pact-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          line-height: 1.1;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .category-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex: 0 0 auto;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.04);
        }
        .pact-name { overflow: hidden; text-overflow: ellipsis; }
        .activity-dot {
          position: absolute;
          left: 6px;
          bottom: 6px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, var(--accent), var(--accent-2));
          box-shadow: 0 0 0 2px rgba(30,201,195,0.15);
        }
        .calendar-cell.has-activity:hover {
          box-shadow: inset 0 0 0 1px var(--accent-3), 0 6px 16px rgba(0,0,0,0.35);
        }
        .calendar-cell.is-today {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
          background: linear-gradient(180deg, rgba(30,201,195,0.08), rgba(61,169,252,0.06)), #0b121a;
        }
        @media (max-width: 640px) {
          .calendar-cell { min-height: 32px; }
          .calendar-day { font-size: 0.75rem; }
        }
      `}</style>
    </section>
  )
}
