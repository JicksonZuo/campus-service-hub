import { useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";
const DEPARTMENTS = [
  "IT Support", "Finance", "Academic Affairs", "Hostel Services",
  "Maintenance", "Security", "Cleaning Services", "Transport", "Library", "Other"
];
const SUGGESTIONS = {
  "IT Support": "Wi-Fi, Network, Computers, Software",
  "Finance": "Tuition, Payments, Refunds",
  "Academic Affairs": "Registration, Exams, Academic Records",
  "Hostel Services": "Accommodation, Hostel Facilities",
  "Maintenance": "Plumbing, Electrical, Repairs",
  "Security": "Safety, Access Control",
  "Cleaning Services": "Cleaning, Sanitation",
  "Transport": "Shuttle, Bus, Transport",
  "Library": "Books, Library Access",
  "Other": "General Support"
};

export default function StaffManagement({ token, staff = [], onStaffCreated, onBack }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", department: "IT Support", specializations: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  function update(e) { setForm((old) => ({ ...old, [e.target.name]: e.target.value })); }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage(""); setError(false);
    try {
      const response = await axios.post(`${API}/admin/requests/staff`, {
        fullName: form.fullName.trim(), email: form.email.trim(), password: form.password,
        department: form.department,
        specializations: form.specializations.split(",").map((s) => s.trim()).filter(Boolean)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(response.data.message || "Staff account created.");
      setForm({ fullName: "", email: "", password: "", department: "IT Support", specializations: "" });
      if (onStaffCreated) await onStaffCreated();
    } catch (e2) {
      setError(true); setMessage(e2.response?.data?.message || e2.message || "Could not create staff account.");
    } finally { setBusy(false); }
  }
  return <div className="single-form-layout">
    <section className="panel form-panel">
      <div className="panel-heading"><div><span className="section-kicker">STAFF MANAGEMENT</span><h2>Add campus staff</h2><p>Create a staff login and assign the department and skills they handle.</p></div></div>
      {message && <p className={`notice notice-${error ? "error" : "success"}`} role="status">{message}</p>}
      <form onSubmit={submit}>
        <label htmlFor="staffFullName">Full name *</label>
        <input id="staffFullName" name="fullName" value={form.fullName} onChange={update} required minLength={2} maxLength={100} />
        <label htmlFor="staffEmail">Work email *</label>
        <input id="staffEmail" name="email" type="email" value={form.email} onChange={update} required />
        <label htmlFor="staffPassword">Temporary password * (at least 6 characters)</label>
        <input id="staffPassword" name="password" type="password" value={form.password} onChange={update} minLength={6} required autoComplete="new-password" />
        <label htmlFor="staffDepartment">Department *</label>
        <select id="staffDepartment" name="department" value={form.department} onChange={update}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
        <label htmlFor="staffSkills">Specializations (comma-separated)</label>
        <input id="staffSkills" name="specializations" value={form.specializations} onChange={update} placeholder={SUGGESTIONS[form.department]} />
        <p className="form-hint">Share the temporary password with the staff member securely. Do not reuse an existing password.</p>
        <div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "Creating..." : "Create staff account"}</button><button className="button button-quiet" type="button" onClick={onBack}>Back to requests</button></div>
      </form>
    </section>
    <section className="panel form-panel">
      <div className="panel-heading"><div><span className="section-kicker">CURRENT TEAM</span><h2>Active staff ({staff.length})</h2><p>These are the active staff accounts currently available for assignment.</p></div></div>
      {staff.length ? <div className="queue-list">{staff.map((member) => <div className="queue-item" key={member._id}>
        <strong>{member.fullName}</strong><span className="queue-category">{member.department || "Department not set"}</span>
        <span className="queue-preview">{member.specializations?.length ? member.specializations.join(", ") : "No specializations listed"} Â· {member.email}</span>
      </div>)}</div> : <div className="empty-state"><strong>No active staff found</strong><p>Create staff accounts above to make them available for assignment.</p></div>}
    </section>
  </div>;
}
