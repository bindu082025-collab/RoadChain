import { useState } from "react";
import "./App.css";
import "./blockchain";
/* ============================================================================
   RoadChain — Frontend-only prototype (Version 1)
   ----------------------------------------------------------------------------
   This build contains NO blockchain, smart contract, ZKP, backend, auth,
   IPFS, or API logic. Every value below is realistic SAMPLE DATA typed
   directly into the component so the team can wire up a real data layer
   later without changing the UI.

   HOW TO CONNECT REAL DATA LATER
   - Replace each "MOCK_*" constant with a fetch/hook call (e.g. useEffect +
     fetch, or a smart-contract read via ethers/wagmi).
   - Keep the same shape (field names) used below so components don't need
     to change, only the data source does.
   ==========================================================================*/

/* ---------------------------------------------------------------------------
   Icons — small inline SVGs so the project needs no icon library.
--------------------------------------------------------------------------- */
const Icon = {
  dashboard: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </svg>
  ),
  road: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M8 21 10.5 3h3L16 21" />
      <path d="M12 4.5v2.2M12 9.6v2.2M12 14.7v2.2" strokeDasharray="2.4 2.4" />
    </svg>
  ),
  complaint: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M4 5.5h16v10H9l-4 3.5v-3.5H4z" />
      <path d="M9.2 9.2h6M9.2 12h4" />
    </svg>
  ),
  contractor: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M3.5 20V9.5l8.5-5 8.5 5V20" />
      <path d="M9 20v-6h6v6" />
    </svg>
  ),
  warranty: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M12 3.5 19 6.5v5.4c0 4.4-3 7.8-7 8.6-4-.8-7-4.2-7-8.6V6.5z" />
      <path d="m9.3 12 1.9 1.9 3.6-3.9" />
    </svg>
  ),
  menu: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  ),
  alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M12 3.8 21 19.5H3z" />
      <path d="M12 9.6v4.2M12 16.6v.1" />
    </svg>
  ),
  chain: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3" y="8" width="8" height="8" rx="3.2" />
      <rect x="13" y="8" width="8" height="8" rx="3.2" />
      <path d="M11 12h2" />
    </svg>
  ),
};

/* ---------------------------------------------------------------------------
   Navigation
--------------------------------------------------------------------------- */
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Icon.dashboard },
  { key: "roads", label: "Roads", icon: Icon.road },
  { key: "complaints", label: "Complaints", icon: Icon.complaint },
  { key: "contractors", label: "Contractors", icon: Icon.contractor },
  { key: "warranty", label: "Warranty Cases", icon: Icon.warranty },
];

/* ---------------------------------------------------------------------------
   MOCK DATA — swap these for real reads later (API / chain / DB)
--------------------------------------------------------------------------- */
const MOCK_SUMMARY = [
  { key: "totalRoads", label: "Total Roads", value: 128, tone: "primary", icon: Icon.road },
  { key: "activeWarranties", label: "Active Warranties", value: 47, tone: "success", icon: Icon.warranty },
  { key: "pendingComplaints", label: "Pending Complaints", value: 23, tone: "warn", icon: Icon.complaint },
  { key: "warrantyViolations", label: "Warranty Violations", value: 6, tone: "danger", icon: Icon.alert },
];

const MOCK_COMPLAINTS = [
  {
    id: "RC-1042",
    roadId: "RD-0087",
    issue: "Pothole cluster near Km 12 marker",
    contractor: "Shivalik Infra Pvt Ltd",
    warranty: "Active · 8 months left",
    status: "Open",
  },
  {
    id: "RC-1041",
    roadId: "RD-0054",
    issue: "Surface cracking after monsoon",
    contractor: "Deccan Roadways Ltd",
    warranty: "Active · 2 months left",
    status: "In Review",
  },
  {
    id: "RC-1038",
    roadId: "RD-0022",
    issue: "Faded lane markings, low visibility",
    contractor: "Ganga Construction Co.",
    warranty: "Expired",
    status: "Escalated",
  },
  {
    id: "RC-1035",
    roadId: "RD-0091",
    issue: "Drainage blockage causing waterlogging",
    contractor: "NHAI Build Corp",
    warranty: "Active · 5 months left",
    status: "Resolved",
  },
  {
    id: "RC-1029",
    roadId: "RD-0063",
    issue: "Uneven patchwork on service lane",
    contractor: "Shivalik Infra Pvt Ltd",
    warranty: "Active · 11 months left",
    status: "Open",
  },
];

const MOCK_CONTRACTORS = [
  { name: "Shivalik Infra Pvt Ltd", trustScore: 88, projects: 24, violations: 1 },
  { name: "NHAI Build Corp", trustScore: 94, projects: 31, violations: 0 },
  { name: "Deccan Roadways Ltd", trustScore: 61, projects: 18, violations: 3 },
  { name: "Ganga Construction Co.", trustScore: 47, projects: 12, violations: 4 },
];

const MOCK_ROADS_ATTENTION = [
  { roadId: "RD-0022", reason: "Warranty expired with unresolved complaint", deadline: "Overdue", status: "Overdue" },
  { roadId: "RD-0054", reason: "Warranty expiring in 15 days", deadline: "05 Sep 2026", status: "Urgent" },
  { roadId: "RD-0087", reason: "3 unresolved complaints on same stretch", deadline: "12 Sep 2026", status: "Monitor" },
  { roadId: "RD-0063", reason: "Scheduled quality re-inspection due", deadline: "20 Sep 2026", status: "Monitor" },
];

/* ---------------------------------------------------------------------------
   Small shared UI pieces
--------------------------------------------------------------------------- */
function StatusBadge({ status }) {
  const toneMap = {
    Open: "warn",
    "In Review": "info",
    Escalated: "danger",
    Resolved: "success",
    Overdue: "danger",
    Urgent: "warn",
    Monitor: "info",
  };
  const tone = toneMap[status] || "info";
  return <span className={`badge badge-${tone}`}>{status}</span>;
}

function TrustBar({ score }) {
  const tone = score >= 80 ? "success" : score >= 60 ? "warn" : "danger";
  return (
    <div className="trust-bar" aria-label={`Trust score ${score} of 100`}>
      <div className={`trust-bar-fill trust-${tone}`} style={{ width: `${score}%` }} />
      <span className="trust-bar-value">{score}</span>
    </div>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action}
      <div className="lane-divider" />
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Layout: Sidebar
--------------------------------------------------------------------------- */
function Sidebar({ active, onSelect, open }) {
  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand">
        <span className="brand-mark">
          <Icon.chain />
        </span>
        <div>
          <p className="brand-name">RoadChain</p>
          <p className="brand-sub">Governance Console</p>
        </div>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map(({ key, label, icon: ItemIcon }) => (
          <button
            key={key}
            className={`nav-item ${active === key ? "nav-item-active" : ""}`}
            onClick={() => onSelect(key)}
          >
            <ItemIcon className="nav-icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>UI Prototype · v1</p>
        <p className="sidebar-footer-muted">Chain layer not yet connected</p>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------------------
   Layout: Header
--------------------------------------------------------------------------- */
function Header({ onMenuToggle }) {
  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuToggle} aria-label="Toggle navigation">
        <Icon.menu />
      </button>

      <div className="topbar-title">
        <h1>RoadChain</h1>
        <p>Road Infrastructure Governance</p>
      </div>

      <div className="topbar-actions">
        <span className="demo-chip">Demo data — chain integration in v2</span>
        <label className="role-select">
          <span>Role</span>
          <select defaultValue="government">
            <option value="government">Government</option>
            <option value="contractor" disabled>Contractor (coming soon)</option>
            <option value="citizen" disabled>Citizen (coming soon)</option>
          </select>
        </label>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------------
   Dashboard sections
--------------------------------------------------------------------------- */
function SummaryCards() {
  return (
    <div className="card-grid">
      {MOCK_SUMMARY.map((item, i) => (
        <div className={`summary-card tone-${item.tone}`} style={{ animationDelay: `${i * 60}ms` }} key={item.key}>
          <div className="summary-icon">
            <item.icon />
          </div>
          <div>
            <p className="summary-value">{item.value}</p>
            <p className="summary-label">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComplaintsTable() {
  return (
    <section className="panel">
      <SectionHeading eyebrow="Live queue" title="Recent Road Complaints" />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Road ID</th>
              <th>Issue</th>
              <th>Contractor</th>
              <th>Warranty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_COMPLAINTS.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.id}</td>
                <td className="mono">{row.roadId}</td>
                <td>{row.issue}</td>
                <td>{row.contractor}</td>
                <td>{row.warranty}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ContractorPerformance() {
  return (
    <section className="panel">
      <SectionHeading eyebrow="Trust ledger (mock)" title="Contractor Performance" />
      <div className="contractor-list">
        {MOCK_CONTRACTORS.map((c) => (
          <div className="contractor-row" key={c.name}>
            <div className="contractor-name">
              <Icon.contractor className="contractor-icon" />
              <span>{c.name}</span>
            </div>
            <TrustBar score={c.trustScore} />
            <div className="contractor-meta">
              <span>{c.projects} projects</span>
              <span className={c.violations > 0 ? "meta-danger" : "meta-success"}>
                {c.violations} violation{c.violations === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoadsAttention() {
  return (
    <section className="panel">
      <SectionHeading eyebrow="Needs review" title="Roads Requiring Attention" />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Road ID</th>
              <th>Reason</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ROADS_ATTENTION.map((row) => (
              <tr key={row.roadId}>
                <td className="mono">{row.roadId}</td>
                <td>{row.reason}</td>
                <td>{row.deadline}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DashboardPage() {
  return (
    <>
      <SummaryCards />
      <div className="panel-grid">
        <ComplaintsTable />
        <div className="panel-stack">
          <ContractorPerformance />
          <RoadsAttention />
        </div>
      </div>
    </>
  );
}

/* Placeholder shown for sidebar sections not yet built in v1. Swap each of
   these for a full page component as the module gets built out. */
function PlaceholderPage({ label, icon: PageIcon }) {
  return (
    <div className="placeholder">
      <PageIcon className="placeholder-icon" />
      <h2>{label}</h2>
      <p>This module is scaffolded for v2 and will connect to live data once the backend and chain layer are ready.</p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   App shell
--------------------------------------------------------------------------- */
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  const pageMeta = NAV_ITEMS.find((n) => n.key === active);

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onSelect={(key) => {
          setActive(key);
          setNavOpen(false);
        }}
        open={navOpen}
      />

      <div className="app-main">
        <Header onMenuToggle={() => setNavOpen((v) => !v)} />

        <main className="content">
          {active === "dashboard" ? (
            <DashboardPage />
          ) : (
            <PlaceholderPage label={pageMeta.label} icon={pageMeta.icon} />
          )}
        </main>
      </div>
    </div>
  );
}
