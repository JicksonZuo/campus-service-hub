
import { useState } from 'react'
import axios from 'axios'
import './App.css'
import './App.compat.css'

const API = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')}/api`;

const STATUSES = [
  'Submitted',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
  'Rejected',
]

function App() {
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')
  const [requests, setRequests] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState('')

  const [auth, setAuth] = useState({
    fullName: '',
    email: '',
    password: '',
    studentId: '',
  })

  const [request, setRequest] = useState({
    title: '',
    description: '',
    category: 'IT Support',
  })

  const [edits, setEdits] = useState({})

  const updateAuth = (e) =>
    setAuth({ ...auth, [e.target.name]: e.target.value })

  const updateRequest = (e) =>
    setRequest({ ...request, [e.target.name]: e.target.value })

  function requestEdit(item) {
    return edits[item._id] || {
      status: item.status || 'Submitted',
      adminResponse: item.adminResponse || '',
      staffId: item.assignedTo?._id || '',
    }
  }

  function updateEdit(id, field, value) {
    setEdits((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }))
  }

  async function handleAuth(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload =
        mode === 'login'
          ? { email: auth.email, password: auth.password }
          : auth

      const response = await axios.post(`${API}${endpoint}`, payload)
      const data = response.data

      if (!data.token || !data.user) {
        throw new Error('The server returned an incomplete login response.')
      }

      setToken(data.token)
      setUser(data.user)
      setMessage(`Welcome to CampusCare, ${data.user.fullName || 'user'}!`)

      await loadRequests(data.token, data.user.role)

      if (data.user.role === 'admin') {
        await loadStaff(data.token)
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          'Authentication failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadRequests(activeToken = token, role = user?.role) {
    try {
      const endpoint =
        role === 'admin' || role === 'staff'
          ? '/admin/requests'
          : '/requests'

      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })

      const data = response.data
      const list = Array.isArray(data)
        ? data
        : data.requests || data.data || []

      setRequests(list)
      setEdits({})
      setMessage('')
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Could not load service requests.'
      )
    }
  }

  async function loadStaff(activeToken = token) {
    try {
      const response = await axios.get(`${API}/admin/requests/staff`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })

      setStaff(response.data.staff || [])
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Could not load staff members.'
      )
    }
  }

  async function submitRequest(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const response = await axios.post(`${API}/requests`, request, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setMessage(
        response.data?.message || 'Your service request was submitted.'
      )

      setRequest({
        title: '',
        description: '',
        category: 'IT Support',
      })

      await loadRequests()
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Could not submit your service request.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function saveStatus(item) {
    const edit = requestEdit(item)
    setSavingId(item._id)
    setMessage('')

    try {
      const response = await axios.put(
        `${API}/admin/requests/${item._id}/status`,
        {
          status: edit.status,
          adminResponse: edit.adminResponse,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setMessage(response.data?.message || 'Request status updated.')
      await loadRequests()
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Could not update request status.'
      )
    } finally {
      setSavingId('')
    }
  }

  async function assignStaff(item) {
    const edit = requestEdit(item)

    if (!edit.staffId) {
      setMessage('Select a staff member before assigning the request.')
      return
    }

    setSavingId(item._id)
    setMessage('')

    try {
      const response = await axios.put(
        `${API}/admin/requests/${item._id}/assign`,
        { staffId: edit.staffId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setMessage(response.data?.message || 'Request assigned successfully.')
      await loadRequests()
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Could not assign this request.'
      )
    } finally {
      setSavingId('')
    }
  }

  function logout() {
    setToken('')
    setUser(null)
    setRequests([])
    setStaff([])
    setEdits({})
    setMessage('')
    setMode('login')
    setAuth({ fullName: '', email: '', password: '', studentId: '' })
  }

  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'
  const isManager = isAdmin || isStaff

  const pendingCount = requests.filter(
    (item) => !['Resolved', 'Closed', 'Rejected'].includes(item.status)
  ).length

  const resolvedCount = requests.filter(
    (item) => item.status === 'Resolved' || item.status === 'Closed'
  ).length

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">CC</span>
          <span>CampusCare</span>
        </a>

        {user && (
          <div className="user-actions">
            <span>{user.fullName}</span>
            <span className="category-label">{user.role}</span>
            <button className="outline-btn" onClick={logout} type="button">
              Sign out
            </button>
          </div>
        )}
      </header>

      <main id="home">
        {!user ? (
          <section className="welcome-layout">
            <div className="welcome-panel">
              <span className="eyebrow">
                SMART CAMPUS SERVICE MANAGEMENT
              </span>
              <h1>Smarter Campus Services. Better Student Experiences.</h1>
              <p>
                A centralized platform for reporting campus issues,
                requesting support, and tracking service requests.
              </p>

              <div className="feature-list">
                <div>
                  <span className="feature-mark">01</span>
                  <span>Submit campus service requests online</span>
                </div>
                <div>
                  <span className="feature-mark">02</span>
                  <span>Track your requests in one place</span>
                </div>
                <div>
                  <span className="feature-mark">03</span>
                  <span>Connect with campus support teams</span>
                </div>
              </div>
            </div>

            <form className="auth-card" onSubmit={handleAuth}>
              <h2>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
              <p className="muted">
                {mode === 'login'
                  ? 'Sign in to access CampusCare.'
                  : 'Register your student account to get started.'}
              </p>

              {mode === 'register' && (
                <>
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    value={auth.fullName}
                    onChange={updateAuth}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />

                  <label htmlFor="studentId">Student ID</label>
                  <input
                    id="studentId"
                    name="studentId"
                    value={auth.studentId}
                    onChange={updateAuth}
                    placeholder="Enter your student ID"
                    required
                  />
                </>
              )}

              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={auth.email}
                onChange={updateAuth}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={auth.password}
                onChange={updateAuth}
                placeholder="Enter your password"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                required
              />

              <button className="primary-btn full-btn" disabled={loading}>
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign in to CampusCare'
                    : 'Create account'}
              </button>

              <p className="switch-mode">
                {mode === 'login'
                  ? "Don't have an account?"
                  : 'Already have an account?'}{' '}
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login')
                    setMessage('')
                  }}
                >
                  {mode === 'login' ? 'Register' : 'Sign in'}
                </button>
              </p>

              {message && <p className="notice" role="status">{message}</p>}
            </form>
          </section>
        ) : (
          <section className="dashboard">
            <div className="dashboard-heading">
              <div>
                <span className="eyebrow">
                  {isAdmin
                    ? 'CAMPUSCARE ADMINISTRATION'
                    : isStaff
                      ? 'CAMPUSCARE STAFF PORTAL'
                      : 'CAMPUSCARE STUDENT PORTAL'}
                </span>
                <h1>
                  {isAdmin
                    ? 'Admin dashboard'
                    : isStaff
                      ? 'Staff dashboard'
                      : 'Your campus dashboard'}
                </h1>
                <p className="muted">
                  {isManager
                    ? 'Review campus service requests and monitor their progress.'
                    : 'Submit an issue or review your previous service requests.'}
                </p>
              </div>

              <button
                className="outline-btn"
                type="button"
                onClick={() => {
                  loadRequests()
                  if (isAdmin) loadStaff()
                }}
                disabled={loading || Boolean(savingId)}
              >
                Refresh requests
              </button>
            </div>

            {message && <p className="notice" role="status">{message}</p>}

            {isManager && (
              <div className="request-card">
                <h2>Service overview</h2>
                <div className="dashboard-grid">
                  <div className="empty-state">
                    <h3>{requests.length}</h3>
                    <p>Total requests</p>
                  </div>
                  <div className="empty-state">
                    <h3>{pendingCount}</h3>
                    <p>Open requests</p>
                  </div>
                  <div className="empty-state">
                    <h3>{resolvedCount}</h3>
                    <p>Resolved or closed</p>
                  </div>
                </div>
              </div>
            )}

            <div className="dashboard-grid">
              {!isManager && (
                <form className="request-card" onSubmit={submitRequest}>
                  <h2>Submit a service request</h2>
                  <p className="muted">
                    Tell the campus support team what assistance you need.
                  </p>

                  <label htmlFor="requestTitle">Request title</label>
                  <input
                    id="requestTitle"
                    name="title"
                    value={request.title}
                    onChange={updateRequest}
                    placeholder="e.g. Campus Wi-Fi Issue"
                    required
                  />

                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={request.category}
                    onChange={updateRequest}
                  >
                    <option>IT Support</option>
                    <option>Hostel Maintenance</option>
                    <option>Electrical</option>
                    <option>Plumbing</option>
                    <option>Cleaning</option>
                    <option>Academic Support</option>
                    <option>Other</option>
                  </select>

                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={request.description}
                    onChange={updateRequest}
                    placeholder="Describe the issue and where it occurred..."
                    rows={5}
                    required
                  />

                  <button className="primary-btn full-btn" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit request'}
                  </button>
                </form>
              )}

              <div className="request-card">
                <div className="request-heading">
                  <div>
                    <h2>{isManager ? 'All service requests' : 'My service requests'}</h2>
                    <p className="muted">
                      {isManager
                        ? 'Review requests and manage their progress.'
                        : 'Review the requests you have submitted.'}
                    </p>
                  </div>
                  <span className="count-badge">{requests.length}</span>
                </div>

                {requests.length === 0 ? (
                  <div className="empty-state">
                    <h3>No requests found</h3>
                    <p>Requests will appear here when available.</p>
                  </div>
                ) : (
                  <div className="request-list">
                    {requests.map((item) => {
                      const edit = requestEdit(item)

                      return (
                        <article className="request-item" key={item._id}>
                          <div className="request-item-heading">
                            <h3>{item.title}</h3>
                            <span className="status-badge">
                              {item.status || 'Submitted'}
                            </span>
                          </div>

                          <p>{item.description}</p>

                          <span className="category-label">
                            {item.category}
                          </span>

                          {isManager && (
                            <>
                              <p className="muted">
                                Student: {item.student?.fullName || 'Student'}
                                {item.student?.studentId
                                  ? ` · ID: ${item.student.studentId}`
                                  : ''}
                              </p>
                              <p className="muted">
                                Assigned to: {item.assignedTo?.fullName || 'Unassigned'}
                              </p>

                              <label htmlFor={`status-${item._id}`}>
                                Update status
                              </label>
                              <select
                                id={`status-${item._id}`}
                                value={edit.status}
                                onChange={(e) =>
                                  updateEdit(item._id, 'status', e.target.value)
                                }
                              >
                                {STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>

                              <label htmlFor={`response-${item._id}`}>
                                Admin response
                              </label>
                              <textarea
                                id={`response-${item._id}`}
                                rows={3}
                                value={edit.adminResponse}
                                onChange={(e) =>
                                  updateEdit(
                                    item._id,
                                    'adminResponse',
                                    e.target.value
                                  )
                                }
                                placeholder="Add an update for the student..."
                              />

                              <button
                                className="primary-btn full-btn"
                                type="button"
                                disabled={savingId === item._id}
                                onClick={() => saveStatus(item)}
                              >
                                {savingId === item._id
                                  ? 'Saving...'
                                  : 'Save status and response'}
                              </button>

                              {isAdmin && (
                                <>
                                  <label htmlFor={`staff-${item._id}`}>
                                    Assign to staff
                                  </label>
                                  <select
                                    id={`staff-${item._id}`}
                                    value={edit.staffId}
                                    onChange={(e) =>
                                      updateEdit(
                                        item._id,
                                        'staffId',
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">Select staff member</option>
                                    {staff.map((member) => (
                                      <option key={member._id} value={member._id}>
                                        {member.fullName} ({member.email})
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    className="outline-btn full-btn"
                                    type="button"
                                    disabled={savingId === item._id}
                                    onClick={() => assignStaff(item)}
                                  >
                                    {savingId === item._id
                                      ? 'Assigning...'
                                      : 'Assign request'}
                                  </button>
                                </>
                              )}

                              {item.adminResponse && (
                                <p className="notice">
                                  Previous response: {item.adminResponse}
                                </p>
                              )}
                            </>
                          )}
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <strong>CampusCare</strong> · Smart Campus Service Management
        <div>Smarter Campus Services. Better Student Experiences.</div>
      </footer>
    </div>
  )
}

export default App
