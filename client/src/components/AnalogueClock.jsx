import React, { useEffect, useMemo, useState } from 'react'

// A compact analogue clock suitable for a header. Ticks every second.
export default function AnalogueClock({ size = 42 }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dims = useMemo(() => ({
    w: size,
    h: size,
    cx: size / 2,
    cy: size / 2,
    r: (size / 2) - 2,
  }), [size])

  const seconds = now.getSeconds() + now.getMilliseconds() / 1000
  const minutes = now.getMinutes() + seconds / 60
  const hours = (now.getHours() % 12) + minutes / 60

  const secAngle = seconds * 6 // 360/60
  const minAngle = minutes * 6
  const hourAngle = hours * 30 // 360/12

  const hand = (angleDeg, length, width, color, rounded = true) => {
    const a = (Math.PI / 180) * (angleDeg - 90)
    const x2 = dims.cx + length * Math.cos(a)
    const y2 = dims.cy + length * Math.sin(a)
    return (
      <line
        x1={dims.cx}
        y1={dims.cy}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap={rounded ? 'round' : 'square'}
      />
    )
  }

  return (
    <div style={{ width: dims.w, height: dims.h, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Current time analogue clock" title={now.toLocaleTimeString()}>
      <svg width={dims.w} height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h}`} role="img" focusable="false" aria-hidden="true">
        {/* Outer circle */}
        <circle cx={dims.cx} cy={dims.cy} r={dims.r} fill="#0b121a" stroke="#1b2a3a" strokeWidth="2" />

        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (Math.PI / 6) * i
          const inner = dims.r - 6
          const outer = dims.r - 1
          const x1 = dims.cx + inner * Math.cos(angle - Math.PI / 2)
          const y1 = dims.cy + inner * Math.sin(angle - Math.PI / 2)
          const x2 = dims.cx + outer * Math.cos(angle - Math.PI / 2)
          const y2 = dims.cy + outer * Math.sin(angle - Math.PI / 2)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a516a" strokeWidth={i % 3 === 0 ? 2 : 1} />
        })}

        {/* Hands */}
        {hand(hourAngle, dims.r * 0.5, 3.5, '#e6f1ff')}
        {hand(minAngle, dims.r * 0.72, 2.5, '#3da9fc')}
        {hand(secAngle, dims.r * 0.82, 1.5, '#1ec9c3')}

        {/* Center cap */}
        <circle cx={dims.cx} cy={dims.cy} r="2.2" fill="#1ec9c3" />
      </svg>
    </div>
  )
}
