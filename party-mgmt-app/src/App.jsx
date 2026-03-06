import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// CONSTANTS & MOCK DATA
// ─────────────────────────────────────────────────────────────
const ROLE_LEVEL = {
  "Super Admin": 0,
  "State Coordinator": 1,
  "District Coordinator": 2,
  "Constituency Coordinator": 3,
  "Booth Worker": 4,
};

const ROLE_COLOR = {
  "Super Admin": "#FF6B35",
  "State Coordinator": "#7B61FF",
  "District Coordinator": "#00B4D8",
  "Constituency Coordinator": "#06D6A0",
  "Booth Worker": "#FFD166",
};

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const PRIORITY_COLOR = { Critical: "#EF476F", High: "#FF6B35", Medium: "#FFD166", Low: "#06D6A0" };

const theme = {
  bg: "#0A0E1A",
  bgCard: "#111827",
  bgCardHover: "#1a2235",
  bgPanel: "#0D1526",
  border: "#1e2d45",
  borderLight: "#253652",
  accent: "#FF6B35",
  text: "#E8EDF5",
  textMuted: "#8B9AB5",
  textFaint: "#4A5A7A",
  success: "#06D6A0",
  warning: "#FFD166",
  danger: "#EF476F",
  info: "#00B4D8",
  purple: "#7B61FF",
};

// ── STORAGE ENGINE ──────────────────────────────────────────
// Simulated scalable storage layer with versioning + timestamps
const DB_VERSION = 1;
const STORAGE_KEYS = {
  users: "js_users_v1",
  tasks: "js_tasks_v1",
  reports: "js_reports_v1",
  events: "js_events_v1",
  messages: "js_messages_v1",
  areas: "js_areas_v1",
  perf: "js_perf_v1",
  mediaBlobs: "js_media_v1",
};

function dbGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}
function dbSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch (e) {
    console.warn("Storage full, clearing old media blobs…");
    localStorage.removeItem(STORAGE_KEYS.mediaBlobs);
    try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch { return false; }
  }
}
function dbUpdate(key, updater) {
  const current = dbGet(key);
  const updated = updater(current);
  dbSet(key, updated);
  return updated;
}

// ── INITIAL SEED DATA ───────────────────────────────────────
const SEED_USERS = [
  { id: 1, name: "Rajiv Sharma", role: "Super Admin", state: "National", district: "-", constituency: "-", booth: "-", status: "active", phone: "9800000001", email: "rajiv@party.in", joined: "2020-01-01", score: 98, parentId: null },
  { id: 2, name: "Priya Nair", role: "State Coordinator", state: "Maharashtra", district: "-", constituency: "-", booth: "-", status: "active", phone: "9800000002", email: "priya@party.in", joined: "2020-03-15", score: 91, parentId: 1 },
  { id: 3, name: "Arjun Singh", role: "State Coordinator", state: "Uttar Pradesh", district: "-", constituency: "-", booth: "-", status: "active", phone: "9800000003", email: "arjun@party.in", joined: "2020-04-01", score: 88, parentId: 1 },
  { id: 4, name: "Deepa Verma", role: "District Coordinator", state: "Maharashtra", district: "Pune", constituency: "-", booth: "-", status: "active", phone: "9800000004", email: "deepa@party.in", joined: "2021-01-10", score: 85, parentId: 2 },
  { id: 5, name: "Suresh Kumar", role: "District Coordinator", state: "Uttar Pradesh", district: "Lucknow", constituency: "-", booth: "-", status: "inactive", phone: "9800000005", email: "suresh@party.in", joined: "2021-02-20", score: 72, parentId: 3 },
  { id: 6, name: "Meena Patel", role: "Constituency Coordinator", state: "Maharashtra", district: "Pune", constituency: "Pune Central", booth: "-", status: "active", phone: "9800000006", email: "meena@party.in", joined: "2021-05-15", score: 80, parentId: 4 },
  { id: 7, name: "Ravi Tiwari", role: "Booth Worker", state: "Maharashtra", district: "Pune", constituency: "Pune Central", booth: "Booth 42", status: "active", phone: "9800000007", email: "ravi@party.in", joined: "2022-01-01", score: 78, parentId: 6 },
  { id: 8, name: "Anjali Gupta", role: "Booth Worker", state: "Maharashtra", district: "Pune", constituency: "Pune Central", booth: "Booth 43", status: "active", phone: "9800000008", email: "anjali@party.in", joined: "2022-03-01", score: 82, parentId: 6 },
  { id: 9, name: "Vikram Rao", role: "Booth Worker", state: "Uttar Pradesh", district: "Lucknow", constituency: "Lucknow West", booth: "Booth 12", status: "inactive", phone: "9800000009", email: "vikram@party.in", joined: "2022-06-01", score: 55, parentId: 5 },
  { id: 10, name: "Kavita Joshi", role: "Constituency Coordinator", state: "Uttar Pradesh", district: "Lucknow", constituency: "Lucknow West", booth: "-", status: "active", phone: "9800000010", email: "kavita@party.in", joined: "2021-08-15", score: 76, parentId: 5 },
];

const SEED_TASKS = [
  { id: 1, title: "Door-to-door voter outreach", type: "Outreach", priority: "High", status: "In Progress", assignedTo: "Ravi Tiwari", assignedToId: 7, area: "Pune Central - Booth 42", deadline: "2025-03-28", progress: 65, createdById: 6 },
  { id: 2, title: "Organize constituency meeting", type: "Meeting", priority: "Medium", status: "Pending", assignedTo: "Meena Patel", assignedToId: 6, area: "Pune Central", deadline: "2025-04-05", progress: 0, createdById: 4 },
  { id: 3, title: "Campaign banner distribution", type: "Campaign", priority: "High", status: "Completed", assignedTo: "Anjali Gupta", assignedToId: 8, area: "Pune Central - Booth 43", deadline: "2025-02-15", progress: 100, createdById: 6, completedReportId: 1 },
  { id: 4, title: "Voter list verification", type: "Outreach", priority: "Critical", status: "In Progress", assignedTo: "Kavita Joshi", assignedToId: 10, area: "Lucknow West", deadline: "2025-03-10", progress: 40, createdById: 5 },
  { id: 5, title: "State rally preparation & logistics", type: "Event Duty", priority: "High", status: "Pending", assignedTo: "Arjun Singh", assignedToId: 3, area: "Uttar Pradesh", deadline: "2025-04-15", progress: 20, createdById: 1 },
  { id: 6, title: "Volunteer training session", type: "Meeting", priority: "Medium", status: "Completed", assignedTo: "Priya Nair", assignedToId: 2, area: "Maharashtra", deadline: "2025-01-30", progress: 100, createdById: 1, completedReportId: 2 },
  { id: 7, title: "Emergency voter registration drive", type: "Outreach", priority: "Critical", status: "Pending", assignedTo: "Ravi Tiwari", assignedToId: 7, area: "Booth 42", deadline: "2025-03-05", progress: 0, createdById: 6 },
  { id: 8, title: "Distribute party manifesto copies", type: "Campaign", priority: "Low", status: "Pending", assignedTo: "Anjali Gupta", assignedToId: 8, area: "Booth 43", deadline: "2025-04-20", progress: 0, createdById: 6 },
];

const SEED_REPORTS = [
  { id: 1, workerId: 8, workerName: "Anjali Gupta", date: "2025-02-25", area: "Booth 43", votersContacted: 45, issues: 0, summary: "Completed banner distribution on Nehru Street. 45 households visited.", hasMedia: true, mediaType: "image", mediaName: "banner_proof.jpg", location: "18.5215° N, 73.8590° E", taskId: 3 },
  { id: 2, workerId: 2, workerName: "Priya Nair", date: "2025-01-30", area: "Maharashtra", votersContacted: 0, issues: 0, summary: "Conducted volunteer training session. 38 volunteers trained on ground operations.", hasMedia: true, mediaType: "document", mediaName: "training_attendance.pdf", location: "19.0760° N, 72.8777° E", taskId: 6 },
  { id: 3, workerId: 7, workerName: "Ravi Tiwari", date: "2025-02-25", area: "Booth 42", votersContacted: 38, issues: 2, summary: "Door-to-door outreach. 38 voters contacted, 2 issues flagged regarding broken street light.", hasMedia: false, mediaType: null, mediaName: null, location: "18.5204° N, 73.8567° E", taskId: null },
];

const SEED_EVENTS = [
  { id: 1, name: "National Convention 2025", date: "2025-04-20", location: "New Delhi", type: "Convention", attendees: 1200, registered: 980, status: "Upcoming" },
  { id: 2, name: "Maharashtra State Rally", date: "2025-04-10", location: "Mumbai", type: "Rally", attendees: 500, registered: 456, status: "Upcoming" },
  { id: 3, name: "Pune District Workshop", date: "2025-03-28", location: "Pune", type: "Workshop", attendees: 80, registered: 72, status: "Upcoming" },
  { id: 4, name: "Voter Awareness Drive", date: "2025-02-15", location: "Multiple Locations", type: "Campaign", attendees: 200, registered: 200, status: "Completed" },
];

const SEED_MESSAGES = [
  { id: 1, from: "Rajiv Sharma", fromId: 1, to: "All Workers", content: "Please ensure 100% voter list verification by March 10th. This is our top priority.", time: "2025-02-25T10:00:00", level: "broadcast", readBy: [] },
  { id: 2, from: "Priya Nair", fromId: 2, to: "Maharashtra Team", content: "State rally preparations are on track. All district coordinators please confirm worker deployment.", time: "2025-02-25T07:00:00", level: "state", readBy: [] },
  { id: 3, from: "Deepa Verma", fromId: 4, to: "Pune District", content: "Booth workers — please submit your daily reports by 8 PM each day.", time: "2025-02-24T09:00:00", level: "district", readBy: [7, 8] },
  { id: 4, from: "Meena Patel", fromId: 6, to: "Pune Central Team", content: "Meeting scheduled for tomorrow at 10 AM at the party office.", time: "2025-02-24T08:00:00", level: "constituency", readBy: [7, 8] },
];

// ── BOOTSTRAP STORAGE ───────────────────────────────────────
function bootstrapStorage() {
  if (!dbGet(STORAGE_KEYS.users)) dbSet(STORAGE_KEYS.users, SEED_USERS);
  if (!dbGet(STORAGE_KEYS.tasks)) dbSet(STORAGE_KEYS.tasks, SEED_TASKS);
  if (!dbGet(STORAGE_KEYS.reports)) dbSet(STORAGE_KEYS.reports, SEED_REPORTS);
  if (!dbGet(STORAGE_KEYS.events)) dbSet(STORAGE_KEYS.events, SEED_EVENTS);
  if (!dbGet(STORAGE_KEYS.messages)) dbSet(STORAGE_KEYS.messages, SEED_MESSAGES);
  if (!dbGet(STORAGE_KEYS.mediaBlobs)) dbSet(STORAGE_KEYS.mediaBlobs, {});
}

function getStorageInfo() {
  let total = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const item = localStorage.getItem(key);
    if (item) total += new Blob([item]).size;
  }
  const maxBytes = 5 * 1024 * 1024; // conservative 5MB estimate
  return {
    usedBytes: total,
    usedKB: Math.round(total / 1024),
    usedMB: (total / (1024 * 1024)).toFixed(2),
    pct: Math.min(100, Math.round((total / maxBytes) * 100)),
    maxMB: "5",
  };
}

// ─────────────────────────────────────────────────────────────
// UI UTILITIES
// ─────────────────────────────────────────────────────────────
function getInitials(name) { return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────
// DESIGN COMPONENTS
// ─────────────────────────────────────────────────────────────
function Avatar({ name, role, size = 36 }) {
  const color = ROLE_COLOR[role] || theme.accent;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${color}33,${color}66)`, border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 700, color, flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

function Badge({ label, color, small }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 4, padding: small ? "1px 6px" : "3px 10px", fontSize: small ? 10 : 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>;
}

function StatusBadge({ status }) {
  const map = { "active": [theme.success, "Active"], "inactive": [theme.textFaint, "Inactive"], "Pending": [theme.warning, "Pending"], "In Progress": [theme.info, "In Progress"], "Completed": [theme.success, "Completed"], "Upcoming": [theme.purple, "Upcoming"], "Critical": [theme.danger, "Critical"], "High": [theme.accent, "High"], "Medium": [theme.warning, "Medium"], "Low": [theme.success, "Low"] };
  const [color, label] = map[status] || [theme.textMuted, status];
  return <Badge label={label} color={color} small />;
}

function Card({ children, style, onClick, hover }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: theme.bgCard, border: `1px solid ${h && hover ? theme.borderLight : theme.border}`, borderRadius: 12, padding: 20, transition: "all 0.2s", transform: h && hover ? "translateY(-2px)" : "none", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, trend, onClick }) {
  return (
    <Card hover onClick={onClick} style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: theme.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
          <div style={{ color: theme.text, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 5 }}>{sub}</div>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: (color || theme.accent) + "18", border: `1px solid ${(color || theme.accent)}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      {trend !== undefined && <div style={{ marginTop: 10, color: trend >= 0 ? theme.success : theme.danger, fontSize: 11, fontWeight: 600 }}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% this week</div>}
    </Card>
  );
}

function ProgressBar({ value, color, height = 6 }) {
  return (
    <div style={{ background: theme.border, borderRadius: 99, height, overflow: "hidden", flexShrink: 0, minWidth: 60 }}>
      <div style={{ width: `${Math.min(100, value)}%`, height: "100%", borderRadius: 99, background: color || theme.accent, transition: "width 0.6s ease" }} />
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", icon, required, style: st }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14, ...st }}>
      {label && <label style={{ display: "block", color: theme.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}{required && <span style={{ color: theme.danger }}> *</span>}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: theme.textFaint, fontSize: 15, pointerEvents: "none" }}>{icon}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: "100%", background: theme.bgPanel, border: `1px solid ${focused ? theme.accent : theme.border}`, borderRadius: 8, padding: `9px ${icon ? "10px 9px 34px" : "12px"}`, color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} />
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 4, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", color: theme.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}{required && <span style={{ color: theme.danger }}> *</span>}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", background: theme.bgPanel, border: `1px solid ${focused ? theme.accent : theme.border}`, borderRadius: 8, padding: "10px 12px", color: theme.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }} />
    </div>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", color: theme.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}{required && <span style={{ color: theme.danger }}> *</span>}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: theme.bgPanel, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "9px 12px", color: theme.text, fontSize: 13, outline: "none", appearance: "none", cursor: "pointer" }}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", style: st, disabled }) {
  const [h, setH] = useState(false);
  const vs = { primary: { background: theme.accent, color: "#fff", border: "none" }, ghost: { background: "transparent", color: theme.textMuted, border: `1px solid ${theme.border}` }, danger: { background: theme.danger + "22", color: theme.danger, border: `1px solid ${theme.danger}44` }, success: { background: theme.success + "22", color: theme.success, border: `1px solid ${theme.success}44` }, info: { background: theme.info + "22", color: theme.info, border: `1px solid ${theme.info}44` }, warning: { background: theme.warning + "22", color: theme.warning, border: `1px solid ${theme.warning}44` } };
  const ss = { sm: { padding: "5px 12px", fontSize: 11 }, md: { padding: "8px 16px", fontSize: 13 }, lg: { padding: "11px 22px", fontSize: 14 } };
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ ...vs[variant], ...ss[size], borderRadius: 8, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : h ? 0.82 : 1, transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "inherit", ...st }}>
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.borderLight}`, borderRadius: 16, padding: 26, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: theme.text, fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// File upload component with base64 storage
function FileUpload({ onFile, file, required }) {
  const inputRef = useRef();
  const handleChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => onFile({ name: f.name, type: f.type, size: f.size, data: ev.target.result });
    reader.readAsDataURL(f);
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", color: theme.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Proof Attachment (Photo / PDF){required && <span style={{ color: theme.danger }}> *</span>}
      </label>
      <div onClick={() => inputRef.current.click()}
        style={{ border: `2px dashed ${file ? theme.success : theme.border}`, borderRadius: 10, padding: "18px 20px", textAlign: "center", cursor: "pointer", background: file ? theme.success + "08" : theme.bgPanel, transition: "all 0.2s" }}>
        <input ref={inputRef} type="file" accept="image/*,.pdf,video/*" style={{ display: "none" }} onChange={handleChange} />
        {file ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{file.type.startsWith("image") ? "🖼" : file.type === "application/pdf" ? "📄" : "🎬"}</div>
            <div style={{ color: theme.success, fontWeight: 600, fontSize: 13 }}>{file.name}</div>
            <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 3 }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
            <div style={{ color: theme.textMuted, fontSize: 13 }}>Click to attach photo, video, or PDF</div>
            <div style={{ color: theme.textFaint, fontSize: 11, marginTop: 3 }}>Required to mark task complete</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPLETE TASK → REPORT MODAL
// Combines task completion + mandatory proof submission
// ─────────────────────────────────────────────────────────────
function CompleteTaskModal({ open, onClose, task, currentUser, onCompleted }) {
  const [summary, setSummary] = useState("");
  const [votersContacted, setVotersContacted] = useState("0");
  const [issues, setIssues] = useState("0");
  const [issueDetail, setIssueDetail] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [gps, setGps] = useState("Detecting…");

  useEffect(() => {
    if (open) {
      setSummary(""); setVotersContacted("0"); setIssues("0"); setIssueDetail(""); setFile(null); setErrors({}); setDone(false);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          p => setGps(`${p.coords.latitude.toFixed(4)}° N, ${p.coords.longitude.toFixed(4)}° E`),
          () => setGps("GPS unavailable — manual entry")
        );
      }
    }
  }, [open]);

  const validate = () => {
    const e = {};
    if (!summary.trim()) e.summary = "Summary is required";
    if (!file) e.file = "Proof attachment is required to mark complete";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      // Save proof blob separately (compressed key)
      const blobKey = `report_media_${Date.now()}`;
      const mediaStore = dbGet(STORAGE_KEYS.mediaBlobs) || {};
      mediaStore[blobKey] = file.data;
      dbSet(STORAGE_KEYS.mediaBlobs, mediaStore);

      // Create report
      const reports = dbGet(STORAGE_KEYS.reports) || [];
      const newReport = {
        id: Date.now(),
        workerId: currentUser.id,
        workerName: currentUser.name,
        date: new Date().toISOString().split("T")[0],
        area: task.area,
        votersContacted: parseInt(votersContacted) || 0,
        issues: parseInt(issues) || 0,
        issueDetail,
        summary,
        hasMedia: true,
        mediaType: file.type.startsWith("image") ? "image" : file.type === "application/pdf" ? "document" : "video",
        mediaName: file.name,
        mediaBlobKey: blobKey,
        location: gps,
        taskId: task.id,
      };
      reports.unshift(newReport);
      dbSet(STORAGE_KEYS.reports, reports);

      // Update task
      const tasks = dbGet(STORAGE_KEYS.tasks) || [];
      const updated = tasks.map(t => t.id === task.id ? { ...t, status: "Completed", progress: 100, completedReportId: newReport.id } : t);
      dbSet(STORAGE_KEYS.tasks, updated);

      // Update worker score
      const users = dbGet(STORAGE_KEYS.users) || [];
      const uUpdated = users.map(u => u.id === currentUser.id ? { ...u, score: Math.min(100, u.score + 2) } : u);
      dbSet(STORAGE_KEYS.users, uUpdated);

      setLoading(false);
      setDone(true);
      setTimeout(() => { onCompleted(); onClose(); }, 1800);
    }, 900);
  };

  return (
    <Modal open={open} onClose={() => { if (!loading) onClose(); }} title="Complete Task — Submit Proof Report" width={580}>
      {done ? (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <h3 style={{ color: theme.success, fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Task Marked Complete!</h3>
          <p style={{ color: theme.textMuted, fontSize: 13 }}>Your report has been saved with proof.</p>
        </div>
      ) : (
        <>
          {/* Task reference */}
          <div style={{ padding: "12px 14px", background: theme.bgPanel, borderRadius: 8, marginBottom: 18, border: `1px solid ${theme.border}` }}>
            <div style={{ color: theme.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Completing Task</div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 14 }}>{task?.title}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {task && <StatusBadge status={task.priority} />}
              <span style={{ color: theme.textMuted, fontSize: 11 }}>📍 {task?.area}</span>
            </div>
          </div>

          {/* Alert */}
          <div style={{ padding: "10px 14px", background: theme.warning + "12", border: `1px solid ${theme.warning}33`, borderRadius: 8, marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span>⚠️</span>
            <span style={{ color: theme.warning, fontSize: 12, fontWeight: 500 }}>A photo, video, or PDF proof is <strong>mandatory</strong> to complete this task. Reports without evidence will not be accepted.</span>
          </div>

          <FileUpload onFile={setFile} file={file} required />
          {errors.file && <div style={{ color: theme.danger, fontSize: 11, marginTop: -10, marginBottom: 12 }}>⚠ {errors.file}</div>}

          <Textarea label="Activity Summary" value={summary} onChange={setSummary} placeholder="Describe what was accomplished, how many people engaged, any challenges faced…" required />
          {errors.summary && <div style={{ color: theme.danger, fontSize: 11, marginTop: -10, marginBottom: 12 }}>⚠ {errors.summary}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Voters Contacted" value={votersContacted} onChange={setVotersContacted} type="number" />
            <Input label="Issues Raised" value={issues} onChange={setIssues} type="number" />
          </div>

          {parseInt(issues) > 0 && (
            <Textarea label="Issue Details" value={issueDetail} onChange={setIssueDetail} placeholder="Describe the issues briefly…" rows={2} />
          )}

          <Input label="GPS Location" value={gps} onChange={setGps} icon="📍" />

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancel</Btn>
            <Btn style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting…" : "✓ Submit Proof & Complete Task"}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("rajiv@party.in");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const demoRoles = [
    { label: "Super Admin", email: "rajiv@party.in" },
    { label: "State Coord.", email: "priya@party.in" },
    { label: "District Coord.", email: "deepa@party.in" },
    { label: "Booth Worker", email: "ravi@party.in" },
  ];

  const handleLogin = () => {
    setLoading(true); setError("");
    setTimeout(() => {
      const users = dbGet(STORAGE_KEYS.users) || SEED_USERS;
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (user && password === "admin123") { onLogin(user); }
      else { setError("Invalid credentials. Use email from demo panel with password: admin123"); }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Trebuchet MS', sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", top: -150, right: -150, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${theme.accent}15, transparent 70%)` }} />
      <div style={{ position: "absolute", bottom: -150, left: -150, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${theme.purple}12, transparent 70%)` }} />

      <div style={{ width: "100%", maxWidth: 400, padding: 20, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 68, height: 68, borderRadius: 16, background: `linear-gradient(135deg,${theme.accent},#FF8C55)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 30, boxShadow: `0 8px 28px ${theme.accent}40` }}>⚑</div>
          <h1 style={{ color: theme.text, fontSize: 22, fontWeight: 800, margin: "0 0 3px", letterSpacing: "-0.02em" }}>Jana Shakti</h1>
          <p style={{ color: theme.textMuted, fontSize: 12, margin: 0 }}>Political Party Management System</p>
        </div>

        <Card>
          <h2 style={{ color: theme.text, fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>Sign in to your account</h2>
          {error && <div style={{ background: theme.danger + "15", border: `1px solid ${theme.danger}33`, borderRadius: 8, padding: "9px 13px", color: theme.danger, fontSize: 12, marginBottom: 14 }}>{error}</div>}
          <Input label="Email" value={email} onChange={setEmail} placeholder="your@email.com" icon="✉" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" icon="🔒" />
          <Btn onClick={handleLogin} disabled={loading} style={{ width: "100%", marginTop: 4 }} size="lg">
            {loading ? "Signing in…" : "Sign In"}
          </Btn>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
            <p style={{ color: theme.textMuted, fontSize: 10, textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Demo Access</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {demoRoles.map(r => (
                <button key={r.label} onClick={() => { setEmail(r.email); setPassword("admin123"); }}
                  style={{ background: theme.bgPanel, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "7px 10px", color: theme.textMuted, fontSize: 11, cursor: "pointer", fontWeight: 500, transition: "all 0.15s", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.target.style.borderColor = theme.accent; e.target.style.color = theme.text; }}
                  onMouseLeave={e => { e.target.style.borderColor = theme.border; e.target.style.color = theme.textMuted; }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROLE-PERSONALIZED DASHBOARDS
// ─────────────────────────────────────────────────────────────

// ── BOOTH WORKER DASHBOARD ─────────────────────────
function BoothWorkerDashboard({ currentUser }) {
  const tasks = (dbGet(STORAGE_KEYS.tasks) || []).filter(t => t.assignedToId === currentUser.id);
  const reports = (dbGet(STORAGE_KEYS.reports) || []).filter(r => r.workerId === currentUser.id);
  const messages = dbGet(STORAGE_KEYS.messages) || [];
  const today = new Date().toISOString().split("T")[0];
  const todayReport = reports.find(r => r.date === today);
  const pendingTasks = tasks.filter(t => t.status !== "Completed");
  const completedTasks = tasks.filter(t => t.status === "Completed");
  const totalVoters = reports.reduce((a, r) => a + r.votersContacted, 0);

  return (
    <div>
      {/* Personal header */}
      <div style={{ background: `linear-gradient(135deg,${theme.warning}15,${theme.accent}10)`, border: `1px solid ${theme.warning}25`, borderRadius: 14, padding: "20px 24px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Avatar name={currentUser.name} role={currentUser.role} size={54} />
          <div>
            <h1 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>My Dashboard — {currentUser.name}</h1>
            <p style={{ color: theme.textMuted, fontSize: 12, margin: "0 0 6px" }}>Booth Worker · {currentUser.booth} · {currentUser.constituency}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge label={`Score: ${currentUser.score}/100`} color={currentUser.score >= 80 ? theme.success : theme.warning} />
              {!todayReport && <Badge label="⚠ Daily report pending" color={theme.danger} />}
              {todayReport && <Badge label="✓ Report submitted today" color={theme.success} />}
            </div>
          </div>
        </div>
      </div>

      {/* Personal stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard label="My Tasks" value={tasks.length} sub={`${pendingTasks.length} pending`} icon="📋" color={theme.warning} />
        <StatCard label="Completed" value={completedTasks.length} sub="Tasks done" icon="✅" color={theme.success} />
        <StatCard label="Reports Filed" value={reports.length} sub="Total submitted" icon="📊" color={theme.info} />
        <StatCard label="Voters Reached" value={totalVoters} sub="Total this period" icon="👤" color={theme.accent} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* My pending tasks */}
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>📋 My Pending Tasks</span>
            <Badge label={`${pendingTasks.length} tasks`} color={theme.warning} />
          </h3>
          {pendingTasks.length === 0 ? (
            <div style={{ color: theme.textFaint, fontSize: 13, textAlign: "center", padding: "20px 0" }}>🎉 All tasks complete!</div>
          ) : (
            pendingTasks.map(t => (
              <div key={t.id} style={{ padding: "10px 0", borderBottom: `1px solid ${theme.border}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                    <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>📅 Due: {t.deadline}</div>
                  </div>
                  <StatusBadge status={t.priority} />
                </div>
                {t.status === "In Progress" && <div style={{ marginTop: 6 }}><ProgressBar value={t.progress} color={theme.info} height={4} /></div>}
              </div>
            ))
          )}
        </Card>

        {/* My recent reports + messages */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ flex: 1 }}>
            <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>📊 My Recent Reports</h3>
            {reports.slice(0, 3).map(r => (
              <div key={r.id} style={{ padding: "8px 0", borderBottom: `1px solid ${theme.border}22` }}>
                <div style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{r.date}</div>
                <div style={{ color: theme.textMuted, fontSize: 11 }}>👤 {r.votersContacted} voters · {r.hasMedia ? "📎 Proof attached" : "No proof"}</div>
              </div>
            ))}
            {reports.length === 0 && <div style={{ color: theme.textFaint, fontSize: 12 }}>No reports yet</div>}
          </Card>
          <Card>
            <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>📣 Messages From Coordinator</h3>
            {messages.slice(0, 2).map(m => (
              <div key={m.id} style={{ padding: "8px 0", borderBottom: `1px solid ${theme.border}22` }}>
                <div style={{ color: theme.textMuted, fontSize: 11, fontWeight: 600 }}>{m.from}</div>
                <div style={{ color: theme.text, fontSize: 12, marginTop: 2 }}>{m.content.slice(0, 80)}…</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── CONSTITUENCY COORDINATOR DASHBOARD ────────────────────
function ConstituencyDashboard({ currentUser }) {
  const allTasks = dbGet(STORAGE_KEYS.tasks) || [];
  const allUsers = dbGet(STORAGE_KEYS.users) || [];
  const allReports = dbGet(STORAGE_KEYS.reports) || [];

  const myWorkers = allUsers.filter(u => u.constituency === currentUser.constituency && u.role === "Booth Worker");
  const myTasks = allTasks.filter(t => t.area.includes(currentUser.constituency) || myWorkers.find(w => w.name === t.assignedTo));
  const myReports = allReports.filter(r => myWorkers.find(w => w.id === r.workerId));
  const activeWorkers = myWorkers.filter(w => w.status === "active");
  const pendingTasks = myTasks.filter(t => t.status === "Pending");
  const completedTasks = myTasks.filter(t => t.status === "Completed");

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${theme.success}15,${theme.info}10)`, border: `1px solid ${theme.success}25`, borderRadius: 14, padding: "18px 22px", marginBottom: 22 }}>
        <h1 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>Constituency: {currentUser.constituency}</h1>
        <p style={{ color: theme.textMuted, fontSize: 12, margin: 0 }}>{currentUser.role} · {currentUser.district} District, {currentUser.state}</p>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard label="My Booth Workers" value={myWorkers.length} sub={`${activeWorkers.length} active`} icon="👥" color={theme.success} />
        <StatCard label="Active Tasks" value={myTasks.length} sub={`${pendingTasks.length} pending`} icon="📋" color={theme.warning} />
        <StatCard label="Reports Today" value={myReports.filter(r => r.date === new Date().toISOString().split("T")[0]).length} sub="From my workers" icon="📊" color={theme.info} />
        <StatCard label="Voters Reached" value={myReports.reduce((a, r) => a + r.votersContacted, 0)} sub="By my workers" icon="👤" color={theme.accent} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Worker status */}
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>👥 My Booth Workers</h3>
          {myWorkers.map(w => {
            const wTasks = myTasks.filter(t => t.assignedTo === w.name);
            const wReports = myReports.filter(r => r.workerId === w.id);
            return (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${theme.border}22` }}>
                <Avatar name={w.name} role={w.role} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{w.name}</div>
                  <div style={{ color: theme.textMuted, fontSize: 11 }}>{w.booth} · {wTasks.length} tasks · {wReports.length} reports</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: w.score >= 80 ? theme.success : theme.warning, fontWeight: 700, fontSize: 13 }}>{w.score}</div>
                  <StatusBadge status={w.status} />
                </div>
              </div>
            );
          })}
          {myWorkers.length === 0 && <div style={{ color: theme.textFaint, fontSize: 12 }}>No booth workers assigned yet</div>}
        </Card>

        {/* Task progress */}
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>📋 Constituency Tasks</h3>
          {[
            { label: "Completed", count: completedTasks.length, color: theme.success },
            { label: "In Progress", count: myTasks.filter(t => t.status === "In Progress").length, color: theme.info },
            { label: "Pending", count: pendingTasks.length, color: theme.warning },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: theme.textMuted, fontSize: 12 }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.count}</span>
              </div>
              <ProgressBar value={myTasks.length ? (s.count / myTasks.length) * 100 : 0} color={s.color} height={8} />
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
            <div style={{ color: theme.textMuted, fontSize: 11, marginBottom: 6 }}>Recent Activity</div>
            {myReports.slice(0, 2).map(r => (
              <div key={r.id} style={{ color: theme.text, fontSize: 12, padding: "5px 0" }}>
                <span style={{ color: theme.textMuted }}>{r.workerName}:</span> {r.summary.slice(0, 55)}…
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── DISTRICT COORDINATOR DASHBOARD ────────────────────────
function DistrictDashboard({ currentUser }) {
  const allTasks = dbGet(STORAGE_KEYS.tasks) || [];
  const allUsers = dbGet(STORAGE_KEYS.users) || [];
  const allReports = dbGet(STORAGE_KEYS.reports) || [];
  const allEvents = dbGet(STORAGE_KEYS.events) || [];

  const districtWorkers = allUsers.filter(u => u.district === currentUser.district && u.state === currentUser.state);
  const constituencies = [...new Set(districtWorkers.filter(u => u.constituency !== "-").map(u => u.constituency))];
  const coordinators = districtWorkers.filter(u => u.role === "Constituency Coordinator");
  const boothWorkers = districtWorkers.filter(u => u.role === "Booth Worker");
  const districtReports = allReports.filter(r => districtWorkers.find(u => u.id === r.workerId));
  const districtTasks = allTasks.filter(t => districtWorkers.find(u => u.name === t.assignedTo));

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${theme.info}15,${theme.purple}10)`, border: `1px solid ${theme.info}25`, borderRadius: 14, padding: "18px 22px", marginBottom: 22 }}>
        <h1 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>District: {currentUser.district}</h1>
        <p style={{ color: theme.textMuted, fontSize: 12, margin: 0 }}>{currentUser.role} · {currentUser.state}</p>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard label="Constituencies" value={constituencies.length} sub="Under this district" icon="🏛" color={theme.purple} />
        <StatCard label="Const. Coordinators" value={coordinators.length} sub={`${coordinators.filter(c=>c.status==="active").length} active`} icon="👔" color={theme.info} />
        <StatCard label="Booth Workers" value={boothWorkers.length} sub={`${boothWorkers.filter(b=>b.status==="active").length} active`} icon="👥" color={theme.success} />
        <StatCard label="Tasks in District" value={districtTasks.length} sub={`${districtTasks.filter(t=>t.status==="Completed").length} completed`} icon="📋" color={theme.warning} />
        <StatCard label="Reports (7 days)" value={districtReports.filter(r => new Date(r.date) > new Date(Date.now() - 7 * 86400000)).length} sub="Field activity" icon="📊" color={theme.accent} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Constituency breakdown */}
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>🏛 Constituency Overview</h3>
          {constituencies.length === 0 && <div style={{ color: theme.textFaint, fontSize: 12 }}>No constituencies mapped yet</div>}
          {constituencies.map(con => {
            const conWorkers = boothWorkers.filter(w => w.constituency === con);
            const conCoord = coordinators.find(c => c.constituency === con);
            const conTasks = districtTasks.filter(t => t.area.includes(con));
            const done = conTasks.filter(t => t.status === "Completed").length;
            return (
              <div key={con} style={{ padding: "12px 0", borderBottom: `1px solid ${theme.border}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{con}</div>
                    <div style={{ color: theme.textMuted, fontSize: 11 }}>Coord: {conCoord?.name || "Unassigned"} · {conWorkers.length} workers</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: theme.textMuted }}>{done}/{conTasks.length} tasks</div>
                </div>
                <ProgressBar value={conTasks.length ? (done / conTasks.length) * 100 : 0} color={theme.info} height={5} />
              </div>
            );
          })}
        </Card>

        {/* Performance + events */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>⭐ Top Workers (District)</h3>
            {boothWorkers.sort((a, b) => b.score - a.score).slice(0, 4).map((w, i) => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${theme.border}22` }}>
                <span style={{ color: theme.textFaint, fontSize: 12, width: 16 }}>#{i + 1}</span>
                <Avatar name={w.name} role={w.role} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{w.name}</div>
                  <div style={{ color: theme.textMuted, fontSize: 10 }}>{w.booth}</div>
                </div>
                <span style={{ color: w.score >= 80 ? theme.success : theme.warning, fontWeight: 700, fontSize: 13 }}>{w.score}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>📅 Upcoming Events</h3>
            {allEvents.filter(e => e.status === "Upcoming").slice(0, 3).map(e => (
              <div key={e.id} style={{ padding: "7px 0", borderBottom: `1px solid ${theme.border}22` }}>
                <div style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{e.name}</div>
                <div style={{ color: theme.textMuted, fontSize: 11 }}>📅 {e.date} · 📍 {e.location}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── STATE COORDINATOR DASHBOARD ───────────────────────────
function StateDashboard({ currentUser }) {
  const allUsers = dbGet(STORAGE_KEYS.users) || [];
  const allTasks = dbGet(STORAGE_KEYS.tasks) || [];
  const allReports = dbGet(STORAGE_KEYS.reports) || [];
  const allEvents = dbGet(STORAGE_KEYS.events) || [];

  const stateUsers = allUsers.filter(u => u.state === currentUser.state);
  const districts = [...new Set(stateUsers.filter(u => u.district !== "-").map(u => u.district))];
  const stateTasks = allTasks.filter(t => stateUsers.find(u => u.name === t.assignedTo));
  const stateReports = allReports.filter(r => stateUsers.find(u => u.id === r.workerId));

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${theme.purple}15,${theme.info}10)`, border: `1px solid ${theme.purple}25`, borderRadius: 14, padding: "18px 22px", marginBottom: 22 }}>
        <h1 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>State: {currentUser.state}</h1>
        <p style={{ color: theme.textMuted, fontSize: 12, margin: 0 }}>{currentUser.role}</p>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard label="Districts" value={districts.length} icon="🗺" color={theme.purple} />
        <StatCard label="Total Workers" value={stateUsers.length} sub={`${stateUsers.filter(u=>u.status==="active").length} active`} icon="👥" color={theme.info} />
        <StatCard label="State Tasks" value={stateTasks.length} sub={`${stateTasks.filter(t=>t.status==="Completed").length} done`} icon="📋" color={theme.warning} />
        <StatCard label="Reports (7d)" value={stateReports.filter(r => new Date(r.date) > new Date(Date.now() - 7 * 86400000)).length} icon="📊" color={theme.success} />
        <StatCard label="Voters Reached" value={stateReports.reduce((a, r) => a + r.votersContacted, 0)} icon="🗳" color={theme.accent} />
      </div>

      {/* District breakdown */}
      <Card style={{ marginBottom: 18 }}>
        <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>📊 District Performance</h3>
        {districts.map(d => {
          const dWorkers = stateUsers.filter(u => u.district === d);
          const dActive = dWorkers.filter(u => u.status === "active").length;
          const dTasks = stateTasks.filter(t => dWorkers.find(u => u.name === t.assignedTo));
          const dDone = dTasks.filter(t => t.status === "Completed").length;
          const coverage = dWorkers.length ? Math.round((dActive / dWorkers.length) * 100) : 0;
          return (
            <div key={d} style={{ padding: "12px 0", borderBottom: `1px solid ${theme.border}22` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{d}</span>
                  <span style={{ color: theme.textMuted, fontSize: 11, marginLeft: 10 }}>{dActive}/{dWorkers.length} workers active · {dDone}/{dTasks.length} tasks done</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: coverage >= 80 ? theme.success : theme.warning, fontWeight: 700, fontSize: 13 }}>{coverage}%</span>
                </div>
              </div>
              <ProgressBar value={coverage} color={coverage >= 80 ? theme.success : coverage >= 60 ? theme.warning : theme.danger} height={6} />
            </div>
          );
        })}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>📋 Recent Tasks in State</h3>
          {stateTasks.slice(0, 5).map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${theme.border}22` }}>
              <div>
                <div style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{t.title}</div>
                <div style={{ color: theme.textMuted, fontSize: 11 }}>{t.assignedTo}</div>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>📅 Upcoming Events</h3>
          {allEvents.filter(e => e.status === "Upcoming").map(e => (
            <div key={e.id} style={{ padding: "8px 0", borderBottom: `1px solid ${theme.border}22` }}>
              <div style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{e.name}</div>
              <div style={{ color: theme.textMuted, fontSize: 11 }}>📅 {e.date} · {e.registered}/{e.attendees} registered</div>
              <ProgressBar value={(e.registered / e.attendees) * 100} color={theme.purple} height={4} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── SUPER ADMIN DASHBOARD ─────────────────────────────────
function SuperAdminDashboard({ currentUser }) {
  const allUsers = dbGet(STORAGE_KEYS.users) || [];
  const allTasks = dbGet(STORAGE_KEYS.tasks) || [];
  const allReports = dbGet(STORAGE_KEYS.reports) || [];
  const allEvents = dbGet(STORAGE_KEYS.events) || [];

  const activeWorkers = allUsers.filter(u => u.status === "active").length;
  const completedTasks = allTasks.filter(t => t.status === "Completed").length;
  const states = [...new Set(allUsers.filter(u => u.state !== "National").map(u => u.state))];

  const stateStats = states.map(s => {
    const sw = allUsers.filter(u => u.state === s);
    return { state: s, total: sw.length, active: sw.filter(u => u.status === "active").length };
  });

  const taskDist = ["Outreach", "Campaign", "Meeting", "Event Duty"].map(type => ({
    type, count: allTasks.filter(t => t.type === type).length,
    color: { Outreach: theme.accent, Campaign: theme.purple, Meeting: theme.info, "Event Duty": theme.warning }[type],
  }));

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${theme.accent}18,${theme.purple}10)`, border: `1px solid ${theme.accent}25`, borderRadius: 14, padding: "20px 24px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>National Command Dashboard</h1>
          <p style={{ color: theme.textMuted, fontSize: 12, margin: 0 }}>Super Admin · Full System Access · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm">📥 Export</Btn>
          <Btn size="sm">+ New Task</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard label="Total Workers" value={allUsers.length} sub={`${activeWorkers} active`} icon="👥" color={theme.info} trend={7} />
        <StatCard label="States Covered" value={states.length} sub="State operations" icon="🗺" color={theme.purple} />
        <StatCard label="Tasks Created" value={allTasks.length} sub={`${completedTasks} completed`} icon="📋" color={theme.accent} trend={12} />
        <StatCard label="Reports Filed" value={allReports.length} sub="Total submissions" icon="📊" color={theme.success} trend={4} />
        <StatCard label="Upcoming Events" value={allEvents.filter(e => e.status === "Upcoming").length} icon="📅" color={theme.warning} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>🗺 State-wise Worker Coverage</h3>
          {stateStats.map(s => {
            const pct = s.total ? Math.round((s.active / s.total) * 100) : 0;
            return (
              <div key={s.state} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{s.state}</span>
                  <span style={{ color: theme.textMuted, fontSize: 12 }}>{s.active}/{s.total} · <span style={{ color: pct >= 80 ? theme.success : theme.warning, fontWeight: 700 }}>{pct}%</span></span>
                </div>
                <ProgressBar value={pct} color={pct >= 80 ? theme.success : pct >= 60 ? theme.warning : theme.danger} />
              </div>
            );
          })}
        </Card>

        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>📌 Task Distribution</h3>
          {taskDist.map(t => (
            <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: t.color + "10", border: `1px solid ${t.color}22`, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: theme.text, fontSize: 13, fontWeight: 500 }}>{t.type}</span>
              <span style={{ color: t.color, fontSize: 18, fontWeight: 800 }}>{t.count}</span>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>🏆 Top Performers</h3>
          {[...allUsers].sort((a, b) => b.score - a.score).slice(0, 5).map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${theme.border}22` }}>
              <span style={{ color: i < 3 ? ["#FFD700", "#C0C0C0", "#CD7F32"][i] : theme.textFaint, fontSize: 12, fontWeight: 700, width: 20 }}>#{i + 1}</span>
              <Avatar name={u.name} role={u.role} size={30} />
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{u.name}</div>
                <div style={{ color: theme.textMuted, fontSize: 10 }}>{u.role}</div>
              </div>
              <span style={{ color: u.score >= 80 ? theme.success : theme.warning, fontWeight: 700 }}>{u.score}</span>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>📊 Recent Field Reports</h3>
          {allReports.slice(0, 4).map(r => (
            <div key={r.id} style={{ padding: "8px 0", borderBottom: `1px solid ${theme.border}22` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{r.workerName}</span>
                <span style={{ color: theme.textMuted, fontSize: 11 }}>{r.date}</span>
              </div>
              <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>👤 {r.votersContacted} voters · {r.hasMedia ? "📎 Proof" : "No proof"}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── DASHBOARD ROUTER ───────────────────────────────────────
function DashboardPage({ currentUser }) {
  const level = ROLE_LEVEL[currentUser.role];
  if (level === 0) return <SuperAdminDashboard currentUser={currentUser} />;
  if (level === 1) return <StateDashboard currentUser={currentUser} />;
  if (level === 2) return <DistrictDashboard currentUser={currentUser} />;
  if (level === 3) return <ConstituencyDashboard currentUser={currentUser} />;
  return <BoothWorkerDashboard currentUser={currentUser} />;
}

// ─────────────────────────────────────────────────────────────
// TASKS PAGE — sorted by priority, complete → report modal
// ─────────────────────────────────────────────────────────────
function TasksPage({ currentUser }) {
  const [tasks, setTasks] = useState(() => dbGet(STORAGE_KEYS.tasks) || []);
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", type: "Outreach", priority: "Medium", assignedTo: "", assignedToId: "", area: "", deadline: "" });

  const users = dbGet(STORAGE_KEYS.users) || [];
  const level = ROLE_LEVEL[currentUser.role];

  // Scope tasks by role
  const scopedTasks = tasks.filter(t => {
    if (level === 0) return true;
    if (level === 4) return t.assignedToId === currentUser.id;
    if (level === 1) return users.find(u => u.name === t.assignedTo && u.state === currentUser.state);
    if (level === 2) return users.find(u => u.name === t.assignedTo && u.district === currentUser.district);
    if (level === 3) return users.find(u => u.name === t.assignedTo && u.constituency === currentUser.constituency);
    return false;
  });

  // ── SORT BY PRIORITY ──
  const PRIORITY_SORT = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const sorted = [...scopedTasks].sort((a, b) => {
    const pDiff = (PRIORITY_SORT[a.priority] ?? 9) - (PRIORITY_SORT[b.priority] ?? 9);
    if (pDiff !== 0) return pDiff;
    // Secondary: status (Pending/In Progress before Completed)
    const sOrder = { "In Progress": 0, Pending: 1, Completed: 2 };
    return (sOrder[a.status] ?? 9) - (sOrder[b.status] ?? 9);
  });

  const filtered = filter === "All" ? sorted : sorted.filter(t => t.status === filter);
  const canCreate = level <= 3;

  const counts = {
    Pending: scopedTasks.filter(t => t.status === "Pending").length,
    "In Progress": scopedTasks.filter(t => t.status === "In Progress").length,
    Completed: scopedTasks.filter(t => t.status === "Completed").length,
  };

  const handleStartTask = (task) => {
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: "In Progress", progress: 10 } : t);
    setTasks(updated); dbSet(STORAGE_KEYS.tasks, updated);
  };

  const handleCompleted = () => {
    const fresh = dbGet(STORAGE_KEYS.tasks) || [];
    setTasks(fresh);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>Task Management</h2>
          <p style={{ color: theme.textMuted, fontSize: 12, margin: 0 }}>Sorted by Priority: Critical → High → Medium → Low</p>
        </div>
        {canCreate && <Btn onClick={() => setShowAdd(true)}>+ Create Task</Btn>}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {["All", "Pending", "In Progress", "Completed"].map(s => (
          <div key={s} onClick={() => setFilter(s)}
            style={{ padding: "10px 18px", background: filter === s ? (s === "Completed" ? theme.success : s === "In Progress" ? theme.info : s === "Pending" ? theme.warning : theme.accent) + "18" : theme.bgCard, border: `1px solid ${filter === s ? (s === "Completed" ? theme.success : s === "In Progress" ? theme.info : s === "Pending" ? theme.warning : theme.accent) : theme.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s === "All" ? theme.accent : s === "Completed" ? theme.success : s === "In Progress" ? theme.info : theme.warning }}>{s === "All" ? scopedTasks.length : counts[s]}</div>
            <div style={{ color: theme.textMuted, fontSize: 11, fontWeight: 500 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Priority legend */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {Object.entries(PRIORITY_COLOR).map(([p, c]) => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", background: c + "15", border: `1px solid ${c}33`, borderRadius: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
            <span style={{ color: c, fontSize: 11, fontWeight: 600 }}>{p}</span>
          </div>
        ))}
        <span style={{ color: theme.textFaint, fontSize: 11, alignSelf: "center", marginLeft: 4 }}>← sorted top to bottom</span>
      </div>

      {/* Task list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(task => {
          const priorityColor = PRIORITY_COLOR[task.priority] || theme.textMuted;
          return (
            <Card key={task.id} style={{ borderLeft: `3px solid ${priorityColor}` }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Priority strip */}
                <div style={{ width: 36, height: 36, borderRadius: 8, background: priorityColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {task.type === "Outreach" ? "🏘" : task.type === "Campaign" ? "📢" : task.type === "Meeting" ? "👥" : "🎪"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <h4 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{task.title}</h4>
                    <Badge label={task.priority} color={priorityColor} small />
                    <StatusBadge status={task.status} />
                    {task.status === "Completed" && task.completedReportId && (
                      <Badge label="📎 Report filed" color={theme.success} small />
                    )}
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: 12 }}>
                    👤 {task.assignedTo} · 📍 {task.area} · 📅 {task.deadline}
                  </div>
                  {task.status !== "Pending" && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <ProgressBar value={task.progress} color={task.status === "Completed" ? theme.success : theme.info} />
                      <span style={{ color: theme.textMuted, fontSize: 11, flexShrink: 0 }}>{task.progress}%</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 7, flexShrink: 0, alignItems: "center" }}>
                  {task.status === "Pending" && (level === 0 || task.assignedToId === currentUser.id || level <= 3) && (
                    <Btn variant="info" size="sm" onClick={() => handleStartTask(task)}>Start</Btn>
                  )}
                  {task.status === "In Progress" && (level === 0 || task.assignedToId === currentUser.id || level <= 3) && (
                    <Btn variant="success" size="sm" onClick={() => setCompletingTask(task)}>Complete</Btn>
                  )}
                  {task.status === "Completed" && (
                    <span style={{ color: theme.success, fontSize: 12, fontWeight: 600 }}>✓ Done</span>
                  )}
                  <Btn variant="ghost" size="sm">Details</Btn>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: theme.textFaint }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div>No tasks found for this filter</div>
          </div>
        )}
      </div>

      {/* Complete Task Modal (mandatory report) */}
      <CompleteTaskModal
        open={!!completingTask}
        onClose={() => setCompletingTask(null)}
        task={completingTask}
        currentUser={currentUser}
        onCompleted={handleCompleted}
      />

      {/* Add Task Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create New Task">
        <Input label="Task Title" value={newTask.title} onChange={v => setNewTask({ ...newTask, title: v })} placeholder="Describe the task" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select label="Type" value={newTask.type} onChange={v => setNewTask({ ...newTask, type: v })} options={["Outreach", "Campaign", "Meeting", "Event Duty"]} />
          <Select label="Priority" value={newTask.priority} onChange={v => setNewTask({ ...newTask, priority: v })} options={["Low", "Medium", "High", "Critical"]} />
        </div>
        <Select label="Assign To" value={newTask.assignedTo} onChange={v => {
          const u = users.find(u => u.name === v);
          setNewTask({ ...newTask, assignedTo: v, assignedToId: u?.id || "" });
        }} options={["", ...users.map(u => u.name)]} required />
        <Input label="Area / Location" value={newTask.area} onChange={v => setNewTask({ ...newTask, area: v })} placeholder="e.g. Pune Central - Booth 42" />
        <Input label="Deadline" value={newTask.deadline} onChange={v => setNewTask({ ...newTask, deadline: v })} type="date" />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</Btn>
          <Btn style={{ flex: 2 }} onClick={() => {
            if (!newTask.title || !newTask.assignedTo) return;
            const updated = [{ ...newTask, id: Date.now(), status: "Pending", progress: 0, createdById: currentUser.id }, ...tasks];
            setTasks(updated); dbSet(STORAGE_KEYS.tasks, updated);
            setShowAdd(false);
            setNewTask({ title: "", type: "Outreach", priority: "Medium", assignedTo: "", assignedToId: "", area: "", deadline: "" });
          }}>Create Task</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTS PAGE
// ─────────────────────────────────────────────────────────────
function ReportsPage({ currentUser }) {
  const [reports, setReports] = useState(() => dbGet(STORAGE_KEYS.reports) || []);
  const [showSubmit, setShowSubmit] = useState(false);
  const [form, setForm] = useState({ summary: "", votersContacted: "0", issues: "0" });
  const [file, setFile] = useState(null);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [gps, setGps] = useState("");
  const [search, setSearch] = useState("");

  const level = ROLE_LEVEL[currentUser.role];
  const users = dbGet(STORAGE_KEYS.users) || [];

  const scopedReports = reports.filter(r => {
    if (level === 0) return true;
    if (level === 4) return r.workerId === currentUser.id;
    if (level === 1) return users.find(u => u.id === r.workerId && u.state === currentUser.state);
    if (level === 2) return users.find(u => u.id === r.workerId && u.district === currentUser.district);
    if (level === 3) return users.find(u => u.id === r.workerId && u.constituency === currentUser.constituency);
    return false;
  }).filter(r => !search || r.workerName.toLowerCase().includes(search.toLowerCase()) || r.summary.toLowerCase().includes(search.toLowerCase()));

  const openSubmit = () => {
    setForm({ summary: "", votersContacted: "0", issues: "0" }); setFile(null); setErrors({}); setDone(false);
    setGps("Detecting…");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setGps(`${p.coords.latitude.toFixed(4)}° N, ${p.coords.longitude.toFixed(4)}° E`),
        () => setGps("GPS unavailable")
      );
    }
    setShowSubmit(true);
  };

  const validate = () => {
    const e = {};
    if (!form.summary.trim()) e.summary = "Summary is required";
    if (!file) e.file = "Proof attachment required";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const blobKey = `report_media_${Date.now()}`;
    const mediaStore = dbGet(STORAGE_KEYS.mediaBlobs) || {};
    mediaStore[blobKey] = file.data;
    dbSet(STORAGE_KEYS.mediaBlobs, mediaStore);

    const newReport = { id: Date.now(), workerId: currentUser.id, workerName: currentUser.name, date: new Date().toISOString().split("T")[0], area: currentUser.booth || currentUser.constituency || currentUser.district || currentUser.state, votersContacted: parseInt(form.votersContacted) || 0, issues: parseInt(form.issues) || 0, summary: form.summary, hasMedia: true, mediaType: file.type.startsWith("image") ? "image" : "document", mediaName: file.name, mediaBlobKey: blobKey, location: gps, taskId: null };
    const updated = [newReport, ...reports];
    setReports(updated); dbSet(STORAGE_KEYS.reports, updated);
    setDone(true);
    setTimeout(() => { setShowSubmit(false); }, 2000);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: 0 }}>Field Reports</h2>
        <Btn onClick={openSubmit}>+ Submit Report</Btn>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <StatCard label="Total Reports" value={scopedReports.length} icon="📊" color={theme.info} />
        <StatCard label="Voters Contacted" value={scopedReports.reduce((a, r) => a + r.votersContacted, 0)} icon="👤" color={theme.success} />
        <StatCard label="Issues Raised" value={scopedReports.reduce((a, r) => a + r.issues, 0)} icon="⚠" color={theme.warning} />
        <StatCard label="With Proof" value={scopedReports.filter(r => r.hasMedia).length} icon="📎" color={theme.purple} />
      </div>

      <Card style={{ marginBottom: 16, padding: "12px 16px" }}>
        <Input label="" value={search} onChange={setSearch} placeholder="🔍 Search reports…" />
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {scopedReports.map(r => (
          <Card key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={r.workerName} role={users.find(u => u.id === r.workerId)?.role || "Booth Worker"} size={36} />
                <div>
                  <div style={{ color: theme.text, fontWeight: 600, fontSize: 13 }}>{r.workerName}</div>
                  <div style={{ color: theme.textMuted, fontSize: 11 }}>📍 {r.area} · 📅 {r.date}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <Badge label={`${r.votersContacted} voters`} color={theme.success} />
                {r.issues > 0 && <Badge label={`${r.issues} issues`} color={theme.warning} />}
                {r.hasMedia ? <Badge label={`📎 ${r.mediaName || "Proof"}`} color={theme.info} /> : <Badge label="No proof" color={theme.danger} />}
                {r.taskId && <Badge label="Linked to task" color={theme.purple} small />}
              </div>
            </div>
            <p style={{ color: theme.textMuted, fontSize: 12, margin: "0 0 8px", lineHeight: 1.6 }}>{r.summary}</p>
            <div style={{ color: theme.textFaint, fontSize: 11 }}>📡 {r.location}</div>
          </Card>
        ))}
        {scopedReports.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: theme.textFaint }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div>No reports found</div>
          </div>
        )}
      </div>

      {/* Submit report modal */}
      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit Daily Field Report" width={560}>
        {done ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h3 style={{ color: theme.success, fontSize: 18, fontWeight: 700, margin: 0 }}>Report Submitted!</h3>
          </div>
        ) : (
          <>
            <div style={{ padding: "10px 14px", background: theme.bgPanel, borderRadius: 8, marginBottom: 14, fontSize: 12, color: theme.textMuted }}>
              Worker: <strong style={{ color: theme.text }}>{currentUser.name}</strong> · {currentUser.booth || currentUser.constituency || currentUser.state}
            </div>
            <FileUpload onFile={setFile} file={file} required />
            {errors.file && <div style={{ color: theme.danger, fontSize: 11, marginTop: -10, marginBottom: 12 }}>⚠ {errors.file}</div>}
            <Textarea label="Summary" value={form.summary} onChange={v => setForm({ ...form, summary: v })} placeholder="What did you accomplish today?" required rows={3} />
            {errors.summary && <div style={{ color: theme.danger, fontSize: 11, marginTop: -10, marginBottom: 12 }}>⚠ {errors.summary}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Voters Contacted" value={form.votersContacted} onChange={v => setForm({ ...form, votersContacted: v })} type="number" />
              <Input label="Issues Raised" value={form.issues} onChange={v => setForm({ ...form, issues: v })} type="number" />
            </div>
            <Input label="GPS" value={gps} onChange={setGps} icon="📍" />
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowSubmit(false)}>Cancel</Btn>
              <Btn style={{ flex: 2 }} onClick={handleSubmit}>Submit Report</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WORKERS PAGE
// ─────────────────────────────────────────────────────────────
function WorkersPage({ currentUser }) {
  const [workers, setWorkers] = useState(() => dbGet(STORAGE_KEYS.users) || []);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newW, setNewW] = useState({ name: "", email: "", phone: "", role: "Booth Worker", state: "", district: "", constituency: "", booth: "", status: "active" });

  const level = ROLE_LEVEL[currentUser.role];

  const scoped = workers.filter(w => {
    if (level === 0) return true;
    if (level === 1) return w.state === currentUser.state;
    if (level === 2) return w.district === currentUser.district && w.state === currentUser.state;
    if (level === 3) return w.constituency === currentUser.constituency;
    return w.id === currentUser.id;
  }).filter(w => {
    const ms = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.email.includes(search);
    const mr = roleFilter === "All" || w.role === roleFilter;
    const mst = statusFilter === "All" || w.status === statusFilter;
    return ms && mr && mst;
  });

  const canManage = level <= 2;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>Worker Management</h2>
          <p style={{ color: theme.textMuted, fontSize: 12, margin: 0 }}>{scoped.length} workers</p>
        </div>
        {canManage && <Btn onClick={() => setShowAdd(true)}>+ Add Worker</Btn>}
      </div>

      <Card style={{ marginBottom: 16, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 180 }}><Input label="" value={search} onChange={setSearch} placeholder="🔍 Search name or email…" /></div>
          <div style={{ flex: 1, minWidth: 140 }}><Select label="" value={roleFilter} onChange={setRoleFilter} options={["All", "Super Admin", "State Coordinator", "District Coordinator", "Constituency Coordinator", "Booth Worker"]} /></div>
          <div style={{ flex: 1, minWidth: 120 }}><Select label="" value={statusFilter} onChange={setStatusFilter} options={["All", "active", "inactive"]} /></div>
          <Btn variant="ghost" size="md" onClick={() => { setSearch(""); setRoleFilter("All"); setStatusFilter("All"); }} style={{ marginBottom: 14 }}>Clear</Btn>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                {["Worker", "Role", "State", "District", "Status", "Score", "Actions"].map(col => (
                  <th key={col} style={{ padding: "10px 14px", color: theme.textMuted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: 10, textAlign: "left", whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scoped.map(w => (
                <tr key={w.id} onClick={() => setSelected(w)}
                  style={{ borderBottom: `1px solid ${theme.border}22`, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.bgCardHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar name={w.name} role={w.role} size={32} />
                      <div><div style={{ color: theme.text, fontWeight: 600 }}>{w.name}</div><div style={{ color: theme.textMuted, fontSize: 11 }}>{w.email}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}><Badge label={w.role} color={ROLE_COLOR[w.role]} small /></td>
                  <td style={{ padding: "12px 14px", color: theme.text }}>{w.state}</td>
                  <td style={{ padding: "12px 14px", color: theme.textMuted }}>{w.district}</td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={w.status} /></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ color: w.score >= 80 ? theme.success : w.score >= 60 ? theme.warning : theme.danger, fontWeight: 700 }}>{w.score}</span>
                      <div style={{ width: 50 }}><ProgressBar value={w.score} color={w.score >= 80 ? theme.success : w.score >= 60 ? theme.warning : theme.danger} height={4} /></div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <Btn variant="ghost" size="sm" onClick={() => setSelected(w)}>View</Btn>
                      {canManage && <Btn variant="info" size="sm">Edit</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Worker profile modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Worker Profile" width={560}>
        {selected && (
          <div>
            <div style={{ display: "flex", gap: 14, marginBottom: 18, padding: 16, background: theme.bgPanel, borderRadius: 10 }}>
              <Avatar name={selected.name} role={selected.role} size={56} />
              <div>
                <h3 style={{ color: theme.text, fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{selected.name}</h3>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <Badge label={selected.role} color={ROLE_COLOR[selected.role]} />
                  <StatusBadge status={selected.status} />
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["📞", "Phone", selected.phone], ["✉", "Email", selected.email], ["🗺", "State", selected.state], ["🏙", "District", selected.district || "—"], ["🏛", "Constituency", selected.constituency || "—"], ["🗳", "Booth", selected.booth || "—"], ["📅", "Joined", selected.joined], ["⭐", "Score", `${selected.score}/100`]].map(([ic, label, val]) => (
                <div key={label} style={{ padding: "10px 12px", background: theme.bg, borderRadius: 8 }}>
                  <div style={{ color: theme.textMuted, fontSize: 10, marginBottom: 3 }}>{ic} {label}</div>
                  <div style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            <ProgressBar value={selected.score} color={selected.score >= 80 ? theme.success : theme.warning} height={10} />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn variant="ghost" style={{ flex: 1 }}>📨 Message</Btn>
              <Btn variant="success" style={{ flex: 1 }}>📋 Assign Task</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Add worker modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register New Worker">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Full Name" value={newW.name} onChange={v => setNewW({ ...newW, name: v })} placeholder="Full name" required />
          <Input label="Phone" value={newW.phone} onChange={v => setNewW({ ...newW, phone: v })} placeholder="10-digit mobile" required />
        </div>
        <Input label="Email" value={newW.email} onChange={v => setNewW({ ...newW, email: v })} placeholder="email@domain.com" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select label="Role" value={newW.role} onChange={v => setNewW({ ...newW, role: v })} options={["State Coordinator", "District Coordinator", "Constituency Coordinator", "Booth Worker"]} />
          <Select label="State" value={newW.state} onChange={v => setNewW({ ...newW, state: v })} options={["", "Maharashtra", "Uttar Pradesh", "Gujarat", "Rajasthan", "Bihar"]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="District" value={newW.district} onChange={v => setNewW({ ...newW, district: v })} placeholder="District name" />
          <Input label="Constituency" value={newW.constituency} onChange={v => setNewW({ ...newW, constituency: v })} placeholder="Constituency" />
        </div>
        <Input label="Booth (if applicable)" value={newW.booth} onChange={v => setNewW({ ...newW, booth: v })} placeholder="e.g. Booth 42" />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</Btn>
          <Btn style={{ flex: 2 }} onClick={() => {
            if (!newW.name || !newW.email) return;
            const updated = [...workers, { ...newW, id: Date.now(), score: 50, joined: new Date().toISOString().split("T")[0] }];
            setWorkers(updated); dbSet(STORAGE_KEYS.users, updated);
            setShowAdd(false);
            setNewW({ name: "", email: "", phone: "", role: "Booth Worker", state: "", district: "", constituency: "", booth: "", status: "active" });
          }}>Register Worker</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EVENTS PAGE
// ─────────────────────────────────────────────────────────────
function EventsPage({ currentUser }) {
  const [events, setEvents] = useState(() => dbGet(STORAGE_KEYS.events) || []);
  const [showAdd, setShowAdd] = useState(false);
  const [newE, setNewE] = useState({ name: "", date: "", location: "", type: "Rally", attendees: "" });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: 0 }}>Events & Campaigns</h2>
        {ROLE_LEVEL[currentUser.role] <= 2 && <Btn onClick={() => setShowAdd(true)}>+ Create Event</Btn>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {events.map(e => {
          const typeColor = { Convention: theme.purple, Rally: theme.accent, Workshop: theme.info, Campaign: theme.success }[e.type] || theme.textMuted;
          return (
            <Card key={e.id} hover>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <Badge label={e.type} color={typeColor} />
                <StatusBadge status={e.status} />
              </div>
              <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>{e.name}</h3>
              <div style={{ color: theme.textMuted, fontSize: 12, marginBottom: 14 }}>📅 {e.date} · 📍 {e.location}</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: theme.textMuted, fontSize: 11 }}>Registration</span>
                  <span style={{ color: theme.text, fontSize: 11, fontWeight: 600 }}>{e.registered}/{e.attendees}</span>
                </div>
                <ProgressBar value={(e.registered / e.attendees) * 100} color={e.registered >= e.attendees * 0.9 ? theme.success : theme.warning} />
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <Btn variant="ghost" size="sm" style={{ flex: 1 }}>👥 Workers</Btn>
                <Btn variant="info" size="sm" style={{ flex: 1 }}>Details</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create New Event">
        <Input label="Event Name" value={newE.name} onChange={v => setNewE({ ...newE, name: v })} placeholder="Event name" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Date" value={newE.date} onChange={v => setNewE({ ...newE, date: v })} type="date" required />
          <Select label="Type" value={newE.type} onChange={v => setNewE({ ...newE, type: v })} options={["Rally", "Convention", "Workshop", "Campaign"]} />
        </div>
        <Input label="Location" value={newE.location} onChange={v => setNewE({ ...newE, location: v })} placeholder="Venue / City" />
        <Input label="Max Attendees" value={newE.attendees} onChange={v => setNewE({ ...newE, attendees: v })} type="number" />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</Btn>
          <Btn style={{ flex: 2 }} onClick={() => {
            if (!newE.name) return;
            const updated = [...events, { ...newE, id: Date.now(), registered: 0, attendees: parseInt(newE.attendees) || 100, status: "Upcoming" }];
            setEvents(updated); dbSet(STORAGE_KEYS.events, updated);
            setShowAdd(false);
            setNewE({ name: "", date: "", location: "", type: "Rally", attendees: "" });
          }}>Create</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MESSAGES PAGE
// ─────────────────────────────────────────────────────────────
function MessagesPage({ currentUser }) {
  const [messages, setMessages] = useState(() => dbGet(STORAGE_KEYS.messages) || []);
  const [active, setActive] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [newMsg, setNewMsg] = useState({ to: "All Workers", content: "", level: "broadcast" });

  const levelColor = { broadcast: theme.accent, state: theme.purple, district: theme.info, constituency: theme.success };
  const unreadCount = messages.filter(m => !m.readBy?.includes(currentUser.id)).length;

  const markRead = (msg) => {
    const updated = messages.map(m => m.id === msg.id ? { ...m, readBy: [...(m.readBy || []), currentUser.id] } : m);
    setMessages(updated); dbSet(STORAGE_KEYS.messages, updated);
    setActive(msg);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: 0 }}>Communication Center</h2>
        {ROLE_LEVEL[currentUser.role] <= 3 && <Btn onClick={() => setShowCompose(true)}>+ Compose</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 18 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>Inbox</span>
            {unreadCount > 0 && <Badge label={`${unreadCount} new`} color={theme.accent} small />}
          </div>
          {messages.map(msg => {
            const isUnread = !msg.readBy?.includes(currentUser.id);
            return (
              <div key={msg.id} onClick={() => markRead(msg)}
                style={{ padding: "13px 16px", borderBottom: `1px solid ${theme.border}22`, cursor: "pointer", background: active?.id === msg.id ? theme.bgCardHover : "transparent", borderLeft: `3px solid ${active?.id === msg.id ? theme.accent : "transparent"}`, transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = theme.bgCardHover}
                onMouseLeave={e => e.currentTarget.style.background = active?.id === msg.id ? theme.bgCardHover : "transparent"}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: isUnread ? theme.text : theme.textMuted, fontWeight: isUnread ? 700 : 500, fontSize: 13 }}>
                    {isUnread && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: theme.accent, marginRight: 6, verticalAlign: "middle" }} />}
                    {msg.from}
                  </span>
                  <span style={{ color: theme.textFaint, fontSize: 10 }}>{timeAgo(msg.time)}</span>
                </div>
                <div style={{ color: theme.textMuted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.content}</div>
                <div style={{ marginTop: 5 }}><Badge label={msg.level} color={levelColor[msg.level]} small /></div>
              </div>
            );
          })}
        </Card>

        <Card>
          {active ? (
            <>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${theme.border}` }}>
                <Avatar name={active.from} role="Super Admin" size={42} />
                <div>
                  <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{active.from}</h3>
                  <div style={{ color: theme.textMuted, fontSize: 11 }}>To: {active.to} · {timeAgo(active.time)}</div>
                  <div style={{ marginTop: 5 }}><Badge label={active.level} color={levelColor[active.level]} small /></div>
                </div>
              </div>
              <p style={{ color: theme.text, fontSize: 13, lineHeight: 1.8, margin: "0 0 18px" }}>{active.content}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" size="sm">↩ Reply</Btn>
                <Btn variant="ghost" size="sm">→ Forward</Btn>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0", color: theme.textFaint }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
              <p>Select a message to read</p>
            </div>
          )}
        </Card>
      </div>

      <Modal open={showCompose} onClose={() => setShowCompose(false)} title="Compose Message">
        <Select label="Audience" value={newMsg.to} onChange={v => setNewMsg({ ...newMsg, to: v })} options={["All Workers", "State Coordinators", "District Coordinators", "Maharashtra Team", "Uttar Pradesh Team"]} />
        <Select label="Level" value={newMsg.level} onChange={v => setNewMsg({ ...newMsg, level: v })} options={[{ value: "broadcast", label: "Broadcast (National)" }, { value: "state", label: "State Level" }, { value: "district", label: "District Level" }, { value: "constituency", label: "Constituency Level" }]} />
        <Textarea label="Message" value={newMsg.content} onChange={v => setNewMsg({ ...newMsg, content: v })} placeholder="Type your message…" required />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowCompose(false)}>Cancel</Btn>
          <Btn style={{ flex: 2 }} onClick={() => {
            if (!newMsg.content) return;
            const updated = [{ id: Date.now(), from: currentUser.name, fromId: currentUser.id, to: newMsg.to, content: newMsg.content, time: new Date().toISOString(), level: newMsg.level, readBy: [currentUser.id] }, ...messages];
            setMessages(updated); dbSet(STORAGE_KEYS.messages, updated);
            setShowCompose(false); setNewMsg({ to: "All Workers", content: "", level: "broadcast" });
          }}>Send</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DATA STORAGE PAGE — new addition
// ─────────────────────────────────────────────────────────────
function DataStoragePage({ currentUser }) {
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [showClearConfirm, setShowClearConfirm] = useState(null);
  const [cleared, setCleared] = useState(false);

  const refresh = () => setStorageInfo(getStorageInfo());

  const modules = [
    { key: STORAGE_KEYS.users, label: "Workers", icon: "👥", color: theme.info },
    { key: STORAGE_KEYS.tasks, label: "Tasks", icon: "📋", color: theme.warning },
    { key: STORAGE_KEYS.reports, label: "Field Reports", icon: "📊", color: theme.success },
    { key: STORAGE_KEYS.events, label: "Events", icon: "📅", color: theme.purple },
    { key: STORAGE_KEYS.messages, label: "Messages", icon: "💬", color: theme.accent },
    { key: STORAGE_KEYS.mediaBlobs, label: "Proof Media (Blobs)", icon: "📎", color: theme.danger },
  ];

  const handleClear = (key, label) => {
    const defaults = {
      [STORAGE_KEYS.users]: SEED_USERS,
      [STORAGE_KEYS.tasks]: SEED_TASKS,
      [STORAGE_KEYS.reports]: SEED_REPORTS,
      [STORAGE_KEYS.events]: SEED_EVENTS,
      [STORAGE_KEYS.messages]: SEED_MESSAGES,
      [STORAGE_KEYS.mediaBlobs]: {},
    };
    dbSet(key, defaults[key] || []);
    setShowClearConfirm(null); setCleared(label); refresh();
    setTimeout(() => setCleared(false), 2000);
  };

  const handleExport = () => {
    const exportData = {};
    for (const [label, key] of Object.entries(STORAGE_KEYS)) {
      exportData[label] = dbGet(key);
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `jana-shakti-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        for (const [label, key] of Object.entries(STORAGE_KEYS)) {
          if (data[label]) dbSet(key, data[label]);
        }
        refresh(); alert("Import successful! Refresh the page to see changes.");
      } catch { alert("Invalid backup file."); }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Data & Storage Management</h2>
        <p style={{ color: theme.textMuted, fontSize: 13, margin: 0 }}>All data is persisted in browser localStorage. Export backups regularly.</p>
      </div>

      {cleared && (
        <div style={{ padding: "12px 16px", background: theme.success + "15", border: `1px solid ${theme.success}33`, borderRadius: 8, marginBottom: 16, color: theme.success, fontSize: 13, fontWeight: 600 }}>
          ✅ {cleared} reset to seed data.
        </div>
      )}

      {/* Storage usage overview */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>💾 Storage Usage</h3>
            <p style={{ color: theme.textMuted, fontSize: 12, margin: 0 }}>Browser localStorage · ~5MB available</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={refresh}>↺ Refresh</Btn>
            <Btn variant="success" size="sm" onClick={handleExport}>📥 Export Backup</Btn>
            <label style={{ cursor: "pointer" }}>
              <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
              <Btn variant="info" size="sm" onClick={() => {}}>📤 Import Backup</Btn>
            </label>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: theme.textMuted, fontSize: 13 }}>Total Used</span>
            <span style={{ color: storageInfo.pct > 80 ? theme.danger : theme.text, fontSize: 13, fontWeight: 700 }}>
              {storageInfo.usedKB} KB / ~{storageInfo.maxMB} MB ({storageInfo.pct}%)
            </span>
          </div>
          <ProgressBar value={storageInfo.pct} color={storageInfo.pct > 80 ? theme.danger : storageInfo.pct > 60 ? theme.warning : theme.success} height={12} />
        </div>
        {storageInfo.pct > 70 && (
          <div style={{ padding: "10px 14px", background: theme.warning + "12", border: `1px solid ${theme.warning}33`, borderRadius: 8, fontSize: 12, color: theme.warning }}>
            ⚠ Storage is {storageInfo.pct}% full. Export a backup and clear proof media blobs to free space.
          </div>
        )}
      </Card>

      {/* Per-module stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 18 }}>
        {modules.map(mod => {
          const data = dbGet(mod.key);
          const count = Array.isArray(data) ? data.length : Object.keys(data || {}).length;
          const sizeBytes = new Blob([JSON.stringify(data)]).size;
          const sizeKB = (sizeBytes / 1024).toFixed(1);
          return (
            <Card key={mod.key}>
              <div style={{ display: "flex", justify: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: mod.color + "18", border: `1px solid ${mod.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{mod.icon}</div>
                  <div>
                    <div style={{ color: theme.text, fontSize: 13, fontWeight: 700 }}>{mod.label}</div>
                    <div style={{ color: theme.textMuted, fontSize: 11 }}>{count} records · {sizeKB} KB</div>
                  </div>
                </div>
              </div>
              <ProgressBar value={Math.min(100, (sizeBytes / (1024 * 800)) * 100)} color={mod.color} height={5} />
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <Btn variant="ghost" size="sm" style={{ flex: 1 }} onClick={() => {
                  const d = dbGet(mod.key);
                  const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `${mod.label.toLowerCase().replace(/ /g, "_")}.json`; a.click();
                  URL.revokeObjectURL(url);
                }}>📥 Export</Btn>
                {ROLE_LEVEL[currentUser.role] === 0 && (
                  <Btn variant="danger" size="sm" style={{ flex: 1 }} onClick={() => setShowClearConfirm(mod)}>🗑 Reset</Btn>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Scalability guide */}
      <Card style={{ marginBottom: 18 }}>
        <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>📈 Scalability Architecture</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {[
            { tier: "Current (Demo)", desc: "Browser localStorage — up to 5MB, single-user, no sync", limit: "~200 workers", color: theme.warning, icon: "🖥" },
            { tier: "Small Deployment", desc: "PostgreSQL + Express API — replaces localStorage, multi-user, backups", limit: "Up to 50K workers", color: theme.info, icon: "🗄" },
            { tier: "Mid-Scale", desc: "PostgreSQL with Prisma ORM + Redis cache + S3 for media files", limit: "Up to 500K workers", color: theme.success, icon: "⚡" },
            { tier: "National Scale", desc: "Sharded PostgreSQL + CDN + Kafka event bus + horizontal Node.js pods", limit: "Millions of workers", color: theme.accent, icon: "🚀" },
          ].map(t => (
            <div key={t.tier} style={{ padding: "14px 16px", background: t.color + "08", border: `1px solid ${t.color}25`, borderRadius: 10 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ color: t.color, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t.tier}</div>
              <div style={{ color: theme.textMuted, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{t.desc}</div>
              <div style={{ color: theme.text, fontSize: 11, fontWeight: 600 }}>✓ {t.limit}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data model reference */}
      <Card>
        <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>🗂 Live Data Records</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                {["Module", "Records", "Last Modified", "Size"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", color: theme.textMuted, fontWeight: 600, textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map(mod => {
                const d = dbGet(mod.key);
                const count = Array.isArray(d) ? d.length : Object.keys(d || {}).length;
                const size = (new Blob([JSON.stringify(d)]).size / 1024).toFixed(2);
                return (
                  <tr key={mod.key} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                    <td style={{ padding: "10px 12px", color: theme.text, fontWeight: 600 }}>{mod.icon} {mod.label}</td>
                    <td style={{ padding: "10px 12px" }}><Badge label={count} color={mod.color} small /></td>
                    <td style={{ padding: "10px 12px", color: theme.textMuted }}>Live</td>
                    <td style={{ padding: "10px 12px", color: theme.textMuted }}>{size} KB</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirm clear modal */}
      <Modal open={!!showClearConfirm} onClose={() => setShowClearConfirm(null)} title="Confirm Reset" width={400}>
        {showClearConfirm && (
          <>
            <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>
              This will reset <strong style={{ color: theme.text }}>{showClearConfirm.label}</strong> to seed data. All changes will be lost.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowClearConfirm(null)}>Cancel</Btn>
              <Btn variant="danger" style={{ flex: 1 }} onClick={() => handleClear(showClearConfirm.key, showClearConfirm.label)}>Reset to Seed</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS PAGE
// ─────────────────────────────────────────────────────────────
function AnalyticsPage({ currentUser }) {
  const users = dbGet(STORAGE_KEYS.users) || [];
  const tasks = dbGet(STORAGE_KEYS.tasks) || [];
  const reports = dbGet(STORAGE_KEYS.reports) || [];

  const level = ROLE_LEVEL[currentUser.role];
  const scopedUsers = level === 0 ? users : level === 1 ? users.filter(u => u.state === currentUser.state) : level === 2 ? users.filter(u => u.district === currentUser.district) : users.filter(u => u.constituency === currentUser.constituency);
  const top = [...scopedUsers].sort((a, b) => b.score - a.score).slice(0, 8);

  return (
    <div>
      <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>Performance Analytics</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>🏆 Top Performers</h3>
          {top.map((w, i) => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${theme.border}22` }}>
              <div style={{ width: 24, textAlign: "center", color: i < 3 ? ["#FFD700", "#C0C0C0", "#CD7F32"][i] : theme.textFaint, fontSize: 12, fontWeight: 700 }}>#{i + 1}</div>
              <Avatar name={w.name} role={w.role} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{w.name}</div>
                <div style={{ color: theme.textMuted, fontSize: 10 }}>{w.role}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: w.score >= 80 ? theme.success : theme.warning, fontWeight: 800, fontSize: 15 }}>{w.score}</div>
                <div style={{ width: 60 }}><ProgressBar value={w.score} color={w.score >= 80 ? theme.success : theme.warning} height={4} /></div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>📈 System Metrics</h3>
          {[
            { label: "Task Completion Rate", value: tasks.length ? Math.round((tasks.filter(t => t.status === "Completed").length / tasks.length) * 100) : 0, color: theme.success, icon: "✅" },
            { label: "Worker Activation Rate", value: users.length ? Math.round((users.filter(u => u.status === "active").length / users.length) * 100) : 0, color: theme.info, icon: "👥" },
            { label: "Reports With Proof", value: reports.length ? Math.round((reports.filter(r => r.hasMedia).length / reports.length) * 100) : 0, color: theme.accent, icon: "📎" },
            { label: "High-Priority Task Rate", value: tasks.length ? Math.round((tasks.filter(t => ["Critical", "High"].includes(t.priority)).length / tasks.length) * 100) : 0, color: theme.danger, icon: "🔥" },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: theme.textMuted, fontSize: 12 }}>{m.icon} {m.label}</span>
                <span style={{ color: m.color, fontWeight: 700, fontSize: 13 }}>{m.value}%</span>
              </div>
              <ProgressBar value={m.value} color={m.color} height={8} />
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: `1px solid ${theme.border}` }}>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Full Performance Table</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                {["Worker", "Role", "Status", "Score", "Performance"].map(h => (
                  <th key={h} style={{ padding: "9px 14px", color: theme.textMuted, fontWeight: 600, textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...scopedUsers].sort((a, b) => b.score - a.score).map(w => (
                <tr key={w.id} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={w.name} role={w.role} size={28} />
                      <div><div style={{ color: theme.text, fontWeight: 600 }}>{w.name}</div><div style={{ color: theme.textMuted, fontSize: 10 }}>{w.state}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}><Badge label={w.role} color={ROLE_COLOR[w.role]} small /></td>
                  <td style={{ padding: "10px 14px" }}><StatusBadge status={w.status} /></td>
                  <td style={{ padding: "10px 14px" }}><span style={{ color: w.score >= 80 ? theme.success : w.score >= 60 ? theme.warning : theme.danger, fontWeight: 700 }}>{w.score}</span></td>
                  <td style={{ padding: "10px 14px", minWidth: 120 }}><ProgressBar value={w.score} color={w.score >= 80 ? theme.success : w.score >= 60 ? theme.warning : theme.danger} height={6} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
function Sidebar({ page, onNav, user, onLogout, collapsed }) {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "workers", label: "Workers", icon: "👥" },
    { id: "tasks", label: "Tasks", icon: "📋" },
    { id: "reports", label: "Reports", icon: "📊" },
    { id: "events", label: "Events", icon: "📅" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "storage", label: "Data & Storage", icon: "💾" },
  ];
  const unreadMsgs = (dbGet(STORAGE_KEYS.messages) || []).filter(m => !m.readBy?.includes(user.id)).length;

  return (
    <div style={{ width: collapsed ? 58 : 218, background: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, overflow: "hidden", transition: "width 0.3s ease", zIndex: 100 }}>
      <div style={{ padding: collapsed ? "18px 10px" : "18px 16px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg,${theme.accent},#FF8C55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚑</div>
          {!collapsed && <div><div style={{ color: theme.text, fontSize: 12, fontWeight: 800 }}>Jana Shakti</div><div style={{ color: theme.textFaint, fontSize: 9 }}>Party Management</div></div>}
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
        {nav.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 10px", background: active ? theme.accent + "18" : "transparent", border: `1px solid ${active ? theme.accent + "33" : "transparent"}`, borderRadius: 7, marginBottom: 2, color: active ? theme.accent : theme.textMuted, cursor: "pointer", transition: "all 0.15s", textAlign: "left", justifyContent: collapsed ? "center" : "flex-start", fontFamily: "inherit", position: "relative" }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = theme.bgCard)}
              onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>{item.label}</span>}
              {item.id === "messages" && unreadMsgs > 0 && (
                <span style={{ marginLeft: "auto", background: theme.accent, color: "white", borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{unreadMsgs}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "10px 8px", borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ padding: "9px 10px", background: theme.bg, borderRadius: 7, marginBottom: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={user.name} role={user.role} size={28} />
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: theme.text, fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ color: theme.textFaint, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.role}</div>
              </div>
            </div>
          </div>
        )}
        <button onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "7px 10px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 7, color: theme.textMuted, cursor: "pointer", fontSize: 11, justifyContent: collapsed ? "center" : "flex-start", transition: "all 0.15s", fontFamily: "inherit" }}
          onMouseEnter={e => { e.currentTarget.style.background = theme.danger + "15"; e.currentTarget.style.color = theme.danger; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.textMuted; }}>
          <span>⏻</span>{!collapsed && " Sign Out"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────
function Header({ user, page, onToggle }) {
  const pageNames = { dashboard: "Dashboard", workers: "Workers", tasks: "Tasks", reports: "Reports", events: "Events", messages: "Messages", analytics: "Analytics", storage: "Data & Storage" };
  const msgs = (dbGet(STORAGE_KEYS.messages) || []).filter(m => !m.readBy?.includes(user.id)).length;
  return (
    <div style={{ height: 58, background: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onToggle} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 6, padding: "5px 8px", color: theme.textMuted, cursor: "pointer", fontSize: 15 }}>☰</button>
        <span style={{ color: theme.text, fontSize: 15, fontWeight: 700 }}>{pageNames[page]}</span>
        <Badge label={user.role} color={ROLE_COLOR[user.role]} small />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", background: theme.success + "15", border: `1px solid ${theme.success}33`, borderRadius: 20 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: theme.success }} />
          <span style={{ color: theme.success, fontSize: 10, fontWeight: 600 }}>Live</span>
        </div>
        <div style={{ position: "relative" }}>
          <button style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 7, padding: "5px 9px", color: theme.textMuted, cursor: "pointer", fontSize: 14 }}>🔔</button>
          {msgs > 0 && <span style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, background: theme.accent, borderRadius: "50%", fontSize: 8, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>{msgs}</span>}
        </div>
        <Avatar name={user.name} role={user.role} size={32} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { bootstrapStorage(); }, []);

  const handleLogin = u => { setUser(u); setPage("dashboard"); };
  const handleLogout = () => { setUser(null); setPage("dashboard"); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const sideW = collapsed ? 58 : 218;

  const pages = {
    dashboard: <DashboardPage currentUser={user} />,
    workers: <WorkersPage currentUser={user} />,
    tasks: <TasksPage currentUser={user} />,
    reports: <ReportsPage currentUser={user} />,
    events: <EventsPage currentUser={user} />,
    messages: <MessagesPage currentUser={user} />,
    analytics: <AnalyticsPage currentUser={user} />,
    storage: <DataStoragePage currentUser={user} />,
  };

  return (
    <div style={{ fontFamily: "'Trebuchet MS', 'Lucida Grande', sans-serif", background: theme.bg, minHeight: "100vh", color: theme.text }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${theme.bg}; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 99px; }
        input, select, textarea, button { font-family: inherit; }
        @media (max-width: 700px) { .main-content { margin-left: 58px !important; } }
      `}</style>

      <Sidebar page={page} onNav={setPage} user={user} onLogout={handleLogout} collapsed={collapsed} />

      <div className="main-content" style={{ marginLeft: sideW, transition: "margin-left 0.3s ease" }}>
        <Header user={user} page={page} onToggle={() => setCollapsed(c => !c)} />
        <main style={{ padding: 22, maxWidth: 1380, margin: "0 auto" }}>
          {pages[page]}
        </main>
      </div>
    </div>
  );
}
