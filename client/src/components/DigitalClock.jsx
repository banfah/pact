import React, { useEffect, useState } from 'react'

// A simple digital clock that updates every second.
export default function DigitalClock({
  locale,
  options = { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  style,
  titlePrefix = 'Current time: ',
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeString = now.toLocaleTimeString(locale, options)

  return (
    <div
      aria-label="Current time digital clock"
      title={titlePrefix + timeString}
      style={{
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.5px',
        color: 'var(--text)',
        fontSize: '0.95rem',
        ...style,
      }}
    >
      {timeString}
    </div>
  )
}
