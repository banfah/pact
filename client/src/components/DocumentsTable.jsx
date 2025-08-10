import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function formatDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    // Fallback if backend returns already a date string; handle both
    return isNaN(d.getTime()) ? String(iso) : d.toLocaleString()
  } catch {
    return String(iso)
  }
}

export default function DocumentsTable() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('') // HTML datetime-local string
  const [formCategory, setFormCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const url = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set('name', search)
    if (categoryFilter) params.set('category', categoryFilter)
    params.set('sort', sortDir)
    params.set('limit', '100')
    return `${API_BASE}/pacts?${params.toString()}`
  }, [search, categoryFilter, sortDir])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [url])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formName.trim() || !formDesc.trim() || !formCategory.trim()) {
      setSubmitError('Name, description, and category are required')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const body = {
        name: formName.trim(),
        description: formDesc.trim(),
        date: formDate ? new Date(formDate).toISOString() : null,
        category: formCategory.trim(),
      }
      const res = await fetch(`${API_BASE}/pacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const created = await res.json()
      // Prepend new item and close form
      setItems((prev) => [created, ...prev])
      // Notify other components (e.g., Calendar) to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pacts-changed', { detail: { type: 'create', id: created?.id } }))
      }
      setShowForm(false)
      setFormName('')
      setFormDesc('')
      setFormDate('')
      setFormCategory('')
    } catch (err) {
      setSubmitError(err.message || 'Failed to create pact')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!id) return
    const ok = window.confirm('Delete this pact? This cannot be undone.')
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`${API_BASE}/pacts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setItems((prev) => prev.filter((x) => x.id !== id))
      // Notify other components (e.g., Calendar) to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pacts-changed', { detail: { type: 'delete', id } }))
      }
    } catch (e) {
      alert(`Failed to delete: ${e.message || e}`)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleEdit(d) {
    if (!d || !d.id) return
    try {
      setEditingId(d.id)
      const newName = window.prompt('Edit name:', d.name ?? '')
      if (newName === null) return
      const newDesc = window.prompt('Edit description:', d.description ?? '')
      if (newDesc === null) return
      const newCategory = window.prompt('Edit category (leave empty to clear):', d.category ?? '')
      if (newCategory === null) return
      const defaultDate = d.date ? new Date(d.date).toISOString() : ''
      const newDateInput = window.prompt('Edit date (ISO 8601 or leave empty for unchanged):', defaultDate)
      if (newDateInput === null) return

      const body = {}
      if (newName !== d.name) body.name = newName
      if (newDesc !== d.description) body.description = newDesc
      if (newCategory !== (d.category ?? '')) body.category = newCategory
      if (newDateInput !== '') {
        const parsed = new Date(newDateInput)
        if (isNaN(parsed.getTime())) {
          alert('Invalid date format. Please use ISO 8601 (e.g., 2025-08-09T21:45:00Z).')
          return
        }
        body.date = parsed.toISOString()
      }

      if (Object.keys(body).length === 0) return

      const res = await fetch(`${API_BASE}/pacts/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated = await res.json()
      setItems((prev) => prev.map((x) => (x.id === d.id ? updated : x)))
      // Notify other components (e.g., Calendar) to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pacts-changed', { detail: { type: 'update', id: d.id } }))
      }
    } catch (e) {
      alert(`Failed to edit: ${e.message || e}`)
    } finally {
      setEditingId(null)
    }
  }

  return (
    <section>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Filter by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="input"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
        <label className="label">
          <span className="label-text">Sort:</span>
          <select className="select" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
        <button className="btn" onClick={() => { /* refetch via state change */ setSearch(s => s); setCategoryFilter(c => c) }} disabled={loading}>
          Refresh
        </button>
        <button className="btn" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : 'Add Pact'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="toolbar" style={{flexWrap:'wrap', gap:'0.75rem'}}>
          <input
            className="input"
            placeholder="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Description"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
          <label className="label">
            <span className="label-text">Date:</span>
            <input
              type="datetime-local"
              className="input"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              style={{minWidth: '220px'}}
            />
          </label>
          <input
            className="input"
            placeholder="Category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            required
          />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
          {submitError && <span className="error" style={{flexBasis:'100%'}}>{submitError}</span>}
        </form>
      )}

      {loading && <p className="loading">Loading documents…</p>}
      {error && <p className="error">Failed to load: {error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '240px' }}>ID</th>
              <th style={{ width: '220px' }}>Name</th>
              <th style={{ width: '160px' }}>Category</th>
              <th style={{ width: '200px' }}>Date</th>
              <th>Description</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={6} className="muted">No documents found.</td>
              </tr>
            )}
            {items.map((d) => (
              <tr key={d.id}>
                <td title={d.id}><code>{d.id}</code></td>
                <td>{d.name}</td>
                <td>{d.category ?? ''}</td>
                <td>{formatDate(d.date)}</td>
                <td>{d.description}</td>
                <td>
                  <button
                    className="btn"
                    onClick={() => handleEdit(d)}
                    disabled={editingId === d.id}
                    title="Edit this pact"
                    style={{ marginRight: '6px' }}
                  >
                    {editingId === d.id ? 'Editing…' : 'Edit'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                    title="Delete this pact"
                  >
                    {deletingId === d.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
