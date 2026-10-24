import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  Command,
  Copy,
  Edit3,
  FolderKanban,
  Gauge,
  Grid2X2,
  List,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useStore } from "./store";
import type {
  Project,
  ProjectStatus,
  Task,
  TaskPriority,
  TaskStatus,
  WorkspaceMember,
} from "./types";
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
} from "./types";
import {
  authFormSchema,
  projectFormSchema,
  taskFormSchema,
} from "./domain/schema";
import {
  remoteEnabled,
  remoteDemo,
  remoteLogin,
  remoteLogout,
  remoteRegister,
} from "./services/apiClient";

const formatDate = (date?: string) =>
  date
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(`${date}T12:00:00`),
      )
    : "No date";
const relative = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const scrollToSection =
  (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

function App() {
  const store = useStore();
  useEffect(() => {
    document.documentElement.dataset.theme =
      store.settings.theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : store.settings.theme;
  }, [store.settings.theme]);
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage signUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/app/*" element={<ProtectedApp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

async function enterDemo(navigate: ReturnType<typeof useNavigate>) {
  if (remoteEnabled) {
    try {
      await remoteDemo();
    } catch {
      // The local demo remains available when the API is not configured locally.
    }
  }
  sessionStorage.setItem("flowboard:session", "active");
  navigate("/app");
}

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Sparkles size={16} />
          </span>
          FlowBoard
        </Link>
        <nav>
          <a href="#features" onClick={scrollToSection("features")}>
            Features
          </a>
          <a href="#how" onClick={scrollToSection("how")}>
            How it works
          </a>
          <Link to="/login">Sign in</Link>
          <ThemeToggle compact />
          <button
            className="button button-dark button-sm"
            onClick={() => void enterDemo(navigate)}
          >
            Try demo <ArrowRight size={15} />
          </button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-dot" /> Built for teams who ship
            </div>
            <h1>
              Make work feel
              <br />
              <em>in motion.</em>
            </h1>
            <p>
              FlowBoard gives your team one calm, focused place to plan
              projects, move tasks forward, and see what matters next.
            </p>
            <div className="hero-actions">
              <button
                className="button button-primary"
                onClick={() => void enterDemo(navigate)}
              >
                Explore the demo <ArrowRight size={17} />
              </button>
              <a
                className="text-link"
                href="#features"
                onClick={scrollToSection("features")}
              >
                See how it works <ArrowRight size={15} />
              </a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span>MR</span>
                <span>AC</span>
                <span>NW</span>
                <span>+8</span>
              </div>
              <span>
                Trusted by focused teams
                <br />
                <strong>who value momentum</strong>
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-window">
              <div className="window-bar">
                <span className="window-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>Product Studio / Overview</span>
                <span className="window-live">
                  <span className="pulse-dot" /> Live demo
                </span>
              </div>
              <div className="preview-body">
                <div className="preview-sidebar">
                  <span className="preview-logo">
                    <Sparkles size={12} />
                  </span>
                  <b>Product Studio</b>
                  <small>WORKSPACE</small>
                  <span className="preview-active">
                    <Gauge size={12} /> Overview
                  </span>
                  <span>
                    <ClipboardList size={12} /> My tasks
                  </span>
                  <span>
                    <FolderKanban size={12} /> Projects
                  </span>
                  <small>TEAM</small>
                  <span>
                    <Users size={12} /> Members
                  </span>
                </div>
                <div className="preview-content">
                  <div className="preview-heading">
                    <div>
                      <small>Wednesday, October 8</small>
                      <h3>
                        Good morning, Mina <span>✦</span>
                      </h3>
                    </div>
                    <div className="preview-avatar">MR</div>
                  </div>
                  <div className="preview-stats">
                    <div>
                      <small>Open tasks</small>
                      <strong>24</strong>
                      <span className="stat-up">↑ 12%</span>
                    </div>
                    <div>
                      <small>Completed</small>
                      <strong>68%</strong>
                      <span className="stat-green">↑ 8%</span>
                    </div>
                    <div>
                      <small>Due this week</small>
                      <strong>07</strong>
                      <span className="stat-warn">3 urgent</span>
                    </div>
                  </div>
                  <div className="preview-lower">
                    <div className="preview-chart">
                      <div className="mini-title">
                        Weekly progress <span>Last 7 days</span>
                      </div>
                      <ResponsiveContainer width="100%" height={115}>
                        <AreaChart
                          data={[
                            { x: "M", v: 20 },
                            { x: "T", v: 42 },
                            { x: "W", v: 35 },
                            { x: "T", v: 62 },
                            { x: "F", v: 55 },
                            { x: "S", v: 75 },
                            { x: "S", v: 88 },
                          ]}
                        >
                          <defs>
                            <linearGradient
                              id="heroFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#818cf8"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="100%"
                                stopColor="#818cf8"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#heroFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="preview-tasks">
                      <div className="mini-title">
                        Today <span>4 tasks</span>
                      </div>
                      <div className="mini-task">
                        <span className="task-check done">
                          <Check size={10} />
                        </span>
                        <span>Review onboarding copy</span>
                        <b>Done</b>
                      </div>
                      <div className="mini-task">
                        <span className="task-check progress" />
                        <span>Command center cards</span>
                        <b className="purple">In progress</b>
                      </div>
                      <div className="mini-task">
                        <span className="task-check" />
                        <span>Share sprint notes</span>
                        <b>Today</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="logo-row">
          <span>PLAN WITH CLARITY</span>
          <span>SHIP WITH CONFIDENCE</span>
          <span>STAY IN FLOW</span>
          <span>BUILD TOGETHER</span>
        </section>
        <section className="section" id="features">
          <div className="section-intro">
            <div className="eyebrow">A better way to work</div>
            <h2>
              Everything your team needs
              <br />
              <span>to keep moving.</span>
            </h2>
            <p>
              From the first idea to the final checkmark, FlowBoard keeps your
              work visible, connected, and delightfully simple.
            </p>
          </div>
          <div className="feature-grid">
            <Feature
              icon={<Grid2X2 />}
              title="One connected workspace"
              text="Projects, tasks, notes, and team context live together so nothing gets lost between tools."
            />
            <Feature
              icon={<Zap />}
              title="A board that moves"
              text="Make progress tangible with a fast, keyboard-friendly Kanban board that matches how your team thinks."
            />
            <Feature
              icon={<Activity />}
              title="Signal over noise"
              text="Dashboards and activity history give you the right level of visibility without another status meeting."
            />
          </div>
        </section>
        <section className="section split-section" id="how">
          <div className="split-visual">
            <div className="flow-visual" aria-label="FlowBoard workflow">
              <div className="flow-step-card">
                <span>01</span>
                <div>
                  <strong>Capture</strong>
                  <small>Turn ideas into clear tasks.</small>
                </div>
                <ClipboardList size={17} />
              </div>
              <div className="flow-connector" aria-hidden="true">
                <span />
              </div>
              <div className="flow-step-card active">
                <span>02</span>
                <div>
                  <strong>Find the flow</strong>
                  <small>See what is blocked or ready.</small>
                </div>
                <Gauge size={17} />
              </div>
              <div className="flow-connector" aria-hidden="true">
                <span />
              </div>
              <div className="flow-step-card">
                <span>03</span>
                <div>
                  <strong>Celebrate</strong>
                  <small>Make progress visible.</small>
                </div>
                <CheckCircle2 size={17} />
              </div>
            </div>
          </div>
          <div className="section-intro">
            <div className="eyebrow">Designed for momentum</div>
            <h2>
              Less status chasing.
              <br />
              <span>More meaningful work.</span>
            </h2>
            <p>
              FlowBoard makes the state of your work easy to understand at a
              glance, so your team can spend more time making progress.
            </p>
            <div className="step-list">
              <div>
                <b>01</b>
                <span>
                  <strong>Capture the work</strong>
                  <small>Turn ideas into clear, actionable tasks.</small>
                </span>
              </div>
              <div>
                <b>02</b>
                <span>
                  <strong>Find the flow</strong>
                  <small>
                    See what is blocked, active, or ready for review.
                  </small>
                </span>
              </div>
              <div>
                <b>03</b>
                <span>
                  <strong>Celebrate progress</strong>
                  <small>Use honest signals to keep your team aligned.</small>
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="cta">
          <div>
            <Sparkles size={18} />
            <h2>Ready to find your flow?</h2>
            <p>
              Step into the demo and see how a calmer project workspace feels.
            </p>
            <button
              className="button button-light"
              onClick={() => {
                sessionStorage.setItem("flowboard:session", "active");
                navigate("/app");
              }}
            >
              Open FlowBoard <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Sparkles size={14} />
          </span>
          FlowBoard
        </Link>
        <span>Thoughtful software for focused teams.</span>
        <span>© 2026 FlowBoard</span>
      </footer>
    </div>
  );
}
function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="feature">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <a href="#how" onClick={scrollToSection("how")}>
        Learn more <ArrowRight size={14} />
      </a>
    </article>
  );
}
function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const store = useStore();
  const dark = store.settings.theme === "dark";
  return (
    <button
      className={`theme-toggle ${compact ? "compact" : ""}`}
      onClick={() => store.updateSettings({ theme: dark ? "light" : "dark" })}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
      {!compact && <span>{dark ? "Light" : "Dark"}</span>}
    </button>
  );
}
function AuthPage({ signUp = false }: { signUp?: boolean }) {
  const [email, setEmail] = useState(signUp ? "" : "mina@flowboard.dev");
  const [password, setPassword] = useState("flowboard");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = authFormSchema.safeParse({ name, email, password });
    if (!parsed.success)
      return setError(
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
      );
    if (remoteEnabled) {
      try {
        if (signUp) await remoteRegister(name, email, password);
        else await remoteLogin(email, password);
      } catch (requestError) {
        return setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to sign in.",
        );
      }
    }
    sessionStorage.setItem("flowboard:session", "active");
    window.location.assign("/app");
  };
  return (
    <div className="auth-page">
      <div className="auth-art">
        <Link to="/" className="brand brand-light">
          <span className="brand-mark">
            <Sparkles size={16} />
          </span>
          FlowBoard
        </Link>
        <div>
          <div className="eyebrow">Your work, in motion</div>
          <h1>
            Clarity for the
            <br />
            <em>work ahead.</em>
          </h1>
          <p>A focused workspace for teams building the future.</p>
        </div>
        <span className="auth-quote">
          “The best workspace is the one that gets out of your way.”
        </span>
      </div>
      <div className="auth-form-wrap">
        <Link to="/" className="auth-mobile-brand brand">
          <span className="brand-mark">
            <Sparkles size={15} />
          </span>
          FlowBoard
        </Link>
        <div className="auth-form">
          <div className="eyebrow">
            {signUp ? "Start your workspace" : "Welcome back"}
          </div>
          <h2>{signUp ? "Create your account" : "Sign in to FlowBoard"}</h2>
          <p className="muted">
            {signUp
              ? "Build a calmer way to work with your team."
              : "Use the demo account to explore the full product."}
          </p>
          <form onSubmit={submit}>
            {signUp && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mina Rahimi"
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>
            <label>
              Password
              <div className="input-wrap">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShow(!show)}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="button button-primary button-wide">
              {signUp ? "Create account" : "Enter demo"}{" "}
              <ArrowRight size={16} />
            </button>
          </form>
          {!signUp && (
            <Link className="form-link" to="/forgot-password">
              Forgot your password?
            </Link>
          )}
          <p className="auth-switch">
            {signUp ? "Already have an account?" : "New to FlowBoard?"}{" "}
            <Link to={signUp ? "/login" : "/signup"}>
              {signUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <div className="demo-note">
            <Sparkles size={15} />
            <span>
              <strong>Demo mode</strong>
              <br />
              No real account or password is created.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-art">
        <Link to="/" className="brand brand-light">
          <span className="brand-mark">
            <Sparkles size={16} />
          </span>
          FlowBoard
        </Link>
        <div>
          <div className="eyebrow">A small reset</div>
          <h1>
            Back to your
            <br />
            <em>best work.</em>
          </h1>
          <p>We keep the path back to your workspace simple.</p>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="eyebrow">Password help</div>
          <h2>Forgot your password?</h2>
          <p className="muted">
            This demo does not send real emails. Return to sign in and use any
            password with six or more characters.
          </p>
          <Link className="button button-primary button-wide" to="/login">
            Back to sign in <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
function ProtectedApp() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("flowboard:session") === "active",
  );
  if (!authenticated) return <Navigate to="/login" replace />;
  return (
    <AppShell
      onLogout={() => {
        if (remoteEnabled) void remoteLogout().catch(() => undefined);
        sessionStorage.removeItem("flowboard:session");
        setAuthenticated(false);
      }}
    />
  );
}
function AppShell({ onLogout }: { onLogout: () => void }) {
  const store = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const lastActivityCount = useRef(store.activities.length);
  const unread = store.notifications.filter((n) => !n.read).length;
  const active =
    store.workspaces.find((w) => w.id === store.activeWorkspaceId) ??
    store.workspaces[0];
  const location = useLocation();
  useEffect(() => {
    document.documentElement.dataset.theme =
      store.settings.theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : store.settings.theme;
  }, [store.settings.theme]);
  useEffect(() => {
    if (store.activities.length > lastActivityCount.current) {
      setToast(store.activities[0]?.message ?? "Saved");
      const timer = window.setTimeout(() => setToast(""), 2800);
      lastActivityCount.current = store.activities.length;
      return () => window.clearTimeout(timer);
    }
    lastActivityCount.current = store.activities.length;
  }, [store.activities]);
  return (
    <div className="app-shell">
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={15} />
          {toast}
        </div>
      )}
      <Sidebar
        open={mobileOpen}
        close={() => setMobileOpen(false)}
        active={active}
        onLogout={onLogout}
      />
      <div className="app-main">
        <header className="app-header">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <span className="breadcrumb-home">
              <Command size={14} />
            </span>
            <span>/</span>
            <strong>
              {location.pathname.includes("projects")
                ? "Projects"
                : location.pathname.includes("settings")
                  ? "Settings"
                  : location.pathname.includes("members")
                    ? "Members"
                    : "Overview"}
            </strong>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              title="Search"
              onClick={() =>
                document.dispatchEvent(new CustomEvent("open-search"))
              }
            >
              <Search size={18} />
            </button>
            <Link
              className="icon-button notification-button"
              to="/app/notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && <span>{unread}</span>}
            </Link>
            <ThemeToggle compact />
            <div className="header-avatar">{store.user.initials}</div>
          </div>
        </header>
        <main className="app-content">
          {store.error && (
            <div className="error-banner" role="alert">
              <CircleHelp size={16} />
              <span>{store.error}</span>
              <button onClick={() => window.location.reload()}>Reload</button>
            </div>
          )}
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="tasks" element={<MyTasks />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound app />} />
          </Routes>
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}
function Sidebar({
  open,
  close,
  active,
  onLogout,
}: {
  open: boolean;
  close: () => void;
  active?: { name: string; color: string };
  onLogout: () => void;
}) {
  const store = useStore();
  const nav = [
    { to: "/app", label: "Overview", icon: <Gauge size={17} />, end: true },
    {
      to: "/app/tasks",
      label: "My tasks",
      icon: <ClipboardList size={17} />,
      badge: store.tasks.filter(
        (t) =>
          t.workspaceId === store.activeWorkspaceId &&
          t.assigneeId === store.user.id &&
          t.status !== "done",
      ).length,
    },
    {
      to: "/app/notifications",
      label: "Inbox",
      icon: <Bell size={17} />,
      badge: store.notifications.filter((n) => !n.read).length,
    },
  ];
  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "visible" : ""}`}
        onClick={close}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <Link className="brand" to="/" onClick={close}>
            <span className="brand-mark">
              <Sparkles size={14} />
            </span>
            FlowBoard
          </Link>
          <button className="mobile-menu close" onClick={close}>
            <X size={19} />
          </button>
        </div>
        <button
          className="workspace-switcher"
          onClick={() => {
            const next =
              store.workspaces[
                (store.workspaces.findIndex(
                  (w) => w.id === store.activeWorkspaceId,
                ) +
                  1) %
                  store.workspaces.length
              ];
            if (next) store.setActiveWorkspace(next.id);
          }}
        >
          <span
            className="workspace-color"
            style={{ background: active?.color }}
          />
          <span>
            <strong>{active?.name}</strong>
            <small>Workspace</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <div className="sidebar-section">
          <small className="sidebar-label">Workspace</small>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={close}
              className={({ isActive }) =>
                `side-link ${isActive ? "active" : ""}`
              }
            >
              <span>
                {item.icon}
                {item.label}
              </span>
              {item.badge ? <b>{item.badge}</b> : null}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label-row">
            <small className="sidebar-label">Projects</small>
            <Link to="/app/projects" onClick={close} aria-label="All projects">
              <Plus size={14} />
            </Link>
          </div>
          {store.projects
            .filter(
              (p) =>
                p.workspaceId === store.activeWorkspaceId &&
                p.status !== "archived",
            )
            .slice(0, 5)
            .map((p) => (
              <NavLink
                key={p.id}
                to={`/app/projects/${p.id}`}
                onClick={close}
                className="project-nav"
              >
                <span className="project-dot" style={{ background: p.color }} />
                {p.name}
                {p.favorite && <span className="favorite-star">✦</span>}
              </NavLink>
            ))}
          <NavLink
            to="/app/projects"
            onClick={close}
            className="side-link muted-link"
          >
            <span>
              <FolderKanban size={16} />
              All projects
            </span>
            <ArrowRight size={14} />
          </NavLink>
        </div>
        <div className="sidebar-section sidebar-management">
          <small className="sidebar-label">Manage</small>
          <NavLink to="/app/members" onClick={close} className="side-link">
            <span>
              <Users size={17} />
              Members
            </span>
          </NavLink>
          <NavLink to="/app/settings" onClick={close} className="side-link">
            <span>
              <Settings size={17} />
              Settings
            </span>
          </NavLink>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <CircleHelp size={16} />
            <span>
              <strong>Need a hand?</strong>
              <small>Read the quick guide</small>
            </span>
          </div>
          <button
            className="profile-mini"
            onClick={() => {
              close();
              onLogout();
            }}
          >
            <span className="header-avatar">{store.user.initials}</span>
            <span>
              <strong>{store.user.name}</strong>
              <small>Demo account</small>
            </span>
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
function PageHeader({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="page-actions">
        {children}
        {action}
      </div>
    </div>
  );
}
function StatCard({
  label,
  value,
  note,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small
          className={
            note.startsWith("↑")
              ? "positive"
              : note.startsWith("!")
                ? "warning"
                : ""
          }
        >
          {note}
        </small>
      </div>
    </div>
  );
}
function PriorityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">
        <i style={{ background: item.color }} />
        {item.name} priority
      </span>
      <strong>
        {item.value} {item.value === 1 ? "task" : "tasks"}
      </strong>
    </div>
  );
}
function Dashboard() {
  const store = useStore();
  const workspaceTasks = store.tasks.filter(
    (t) => t.workspaceId === store.activeWorkspaceId,
  );
  const projects = store.projects.filter(
    (p) => p.workspaceId === store.activeWorkspaceId,
  );
  const completed = workspaceTasks.filter((t) => t.status === "done").length;
  const overdue = workspaceTasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate < new Date().toISOString().slice(0, 10) &&
      t.status !== "done",
  ).length;
  const mine = workspaceTasks.filter(
    (t) => t.assigneeId === store.user.id && t.status !== "done",
  );
  const completion = workspaceTasks.length
    ? Math.round((completed / workspaceTasks.length) * 100)
    : 0;
  const chart = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2),
      completed:
        store.activities.filter(
          (a) => a.createdAt.slice(0, 10) === key && a.message.includes("done"),
        ).length +
        (i * 1 + 1),
      planned: i * 2 + 2,
    };
  });
  const priorityData = (["urgent", "high", "medium", "low"] as TaskPriority[])
    .map((priority) => ({
      name: PRIORITY_LABELS[priority],
      value: workspaceTasks.filter((t) => t.priority === priority).length,
    }))
    .filter((x) => x.value);
  return (
    <>
      <PageHeader
        eyebrow={`Wednesday, October 8, 2026`}
        title={`Good morning, ${store.user.name.split(" ")[0]}`}
        description="Here is what is happening across your workspace today."
        action={
          <button
            className="button button-primary"
            onClick={() =>
              document.dispatchEvent(
                new CustomEvent("open-task", { detail: {} }),
              )
            }
          >
            <Plus size={16} /> New task
          </button>
        }
      />
      <section className="stats-grid">
        <StatCard
          label="Open tasks"
          value={workspaceTasks.filter((t) => t.status !== "done").length}
          note="↑ 12% this week"
          icon={<ClipboardList size={19} />}
        />
        <StatCard
          label="Completion rate"
          value={`${completion}%`}
          note="↑ 8% this week"
          icon={<CheckCircle2 size={19} />}
          tone="green"
        />
        <StatCard
          label="Active projects"
          value={projects.filter((p) => p.status === "active").length}
          note={`${projects.length} total projects`}
          icon={<FolderKanban size={19} />}
          tone="blue"
        />
        <StatCard
          label="Needs attention"
          value={overdue}
          note={overdue ? "! overdue tasks" : "You are all caught up"}
          icon={<Clock3 size={19} />}
          tone="amber"
        />
      </section>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Team momentum</h2>
              <p>Completed work over the last seven days.</p>
            </div>
            <button className="select-button">
              Last 7 days <ChevronDown size={14} />
            </button>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chart} margin={{ left: -25, right: 8, top: 12 }}>
                <defs>
                  <linearGradient
                    id="dashboardFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    background: "var(--surface)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="planned"
                  stroke="var(--border-strong)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#dashboardFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot indigo" /> Completed
            </span>
            <span>
              <i className="legend-line" /> Planned
            </span>
          </div>
        </section>
        <section className="panel priority-panel">
          <div className="panel-heading">
            <div>
              <h2>Priority mix</h2>
              <p>Where attention is going.</p>
            </div>
            <Link to="/app/tasks" className="panel-link">
              View tasks <ArrowRight size={14} />
            </Link>
          </div>
          {priorityData.length ? (
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={4}
                  >
                    <Cell fill="#e11d48" />
                    <Cell fill="#f97316" />
                    <Cell fill="#4f46e5" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip content={<PriorityTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <strong>{workspaceTasks.length}</strong>
                <span>tasks</span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardList size={20} />}
              title="No tasks yet"
              text="Create a task to see your mix."
            />
          )}
          {priorityData.length > 0 && (
            <div className="priority-legend">
              {priorityData.map((item, index) => (
                <span key={item.name}>
                  <i
                    style={{
                      background: ["#e11d48", "#f97316", "#4f46e5", "#94a3b8"][
                        index
                      ],
                    }}
                  />
                  {item.name}
                  <b>{item.value}</b>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="dashboard-grid lower">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>My focus</h2>
              <p>Your next pieces of work.</p>
            </div>
            <Link to="/app/tasks" className="panel-link">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="focus-list">
            {mine.slice(0, 4).map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
            {mine.length === 0 && (
              <EmptyState
                title="Nothing assigned"
                text="You are all caught up in this workspace."
              />
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>A pulse on your workspace.</p>
            </div>
            <Activity size={17} className="muted" />
          </div>
          <div className="activity-list">
            {store.activities.slice(0, 5).map((a) => (
              <ActivityRow
                key={a.id}
                activity={a.message}
                date={relative(a.createdAt)}
                actor={store.members.find((m) => m.id === a.actorId)}
              />
            ))}
          </div>
        </section>
      </div>
      <TaskModal />
    </>
  );
}
function TaskRow({ task, onClick }: { task: Task; onClick?: () => void }) {
  const store = useStore();
  const project = store.projects.find((p) => p.id === task.projectId);
  const assignee = store.members.find((m) => m.id === task.assigneeId);
  return (
    <button
      className="task-row"
      onClick={
        onClick ??
        (() =>
          document.dispatchEvent(
            new CustomEvent("open-task", { detail: { taskId: task.id } }),
          ))
      }
    >
      <span
        className={`task-check ${task.status === "done" ? "done" : task.status === "in-progress" ? "progress" : ""}`}
      >
        {task.status === "done" && <Check size={11} />}
      </span>
      <span className="task-row-main">
        <strong>{task.title}</strong>
        <small>
          <span
            className="project-dot"
            style={{ background: project?.color }}
          />
          {project?.name}
        </small>
      </span>
      <span
        className={`priority-dot ${task.priority}`}
        title={PRIORITY_LABELS[task.priority]}
      />
      <span className={`status-pill ${task.status}`}>
        {STATUS_LABELS[task.status]}
      </span>
      <span className="row-date">{formatDate(task.dueDate)}</span>
      {assignee && <span className="mini-avatar">{assignee.initials}</span>}
    </button>
  );
}
function ActivityRow({
  activity,
  date,
  actor,
}: {
  activity: string;
  date: string;
  actor?: WorkspaceMember;
}) {
  return (
    <div className="activity-row">
      <span className="mini-avatar">{actor?.initials ?? "FB"}</span>
      <span>
        <strong>{actor?.name ?? "FlowBoard"}</strong> {activity}
        <small>{date}</small>
      </span>
    </div>
  );
}
function ProjectsPage() {
  const store = useStore();
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const projects = store.projects.filter(
    (p) =>
      p.workspaceId === store.activeWorkspaceId &&
      (status === "all" || p.status === status),
  );
  return (
    <>
      <PageHeader
        eyebrow="Workspace / Projects"
        title="Projects"
        description="A clear view of every initiative in motion."
        action={
          <button
            className="button button-primary"
            onClick={() =>
              document.dispatchEvent(new CustomEvent("open-project"))
            }
          >
            <Plus size={16} /> New project
          </button>
        }
      />
      <div className="toolbar">
        <div className="tabs">
          <button
            className={status === "all" ? "active" : ""}
            onClick={() => setStatus("all")}
          >
            All{" "}
            <b>
              {
                store.projects.filter(
                  (p) => p.workspaceId === store.activeWorkspaceId,
                ).length
              }
            </b>
          </button>
          {(
            ["active", "planning", "completed", "on-hold"] as ProjectStatus[]
          ).map((x) => (
            <button
              key={x}
              className={status === x ? "active" : ""}
              onClick={() => setStatus(x)}
            >
              {PROJECT_STATUS_LABELS[x]}
            </button>
          ))}
        </div>
        <button className="filter-button">
          <SlidersHorizontal size={15} /> Filter
        </button>
      </div>
      <div className="projects-grid">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
        <button
          className="new-project-card"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("open-project"))
          }
        >
          <span>
            <Plus size={20} />
          </span>
          <strong>Start a new project</strong>
          <small>Turn an idea into momentum.</small>
        </button>
      </div>
      <ProjectModal />
    </>
  );
}
function ProjectCard({ project }: { project: Project }) {
  const store = useStore();
  const navigate = useNavigate();
  const tasks = store.tasks.filter((t) => t.projectId === project.id);
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <article
      className="project-card"
      onClick={() => navigate(`/app/projects/${project.id}`)}
    >
      <div className="project-card-top">
        <span
          className="project-symbol"
          style={{ background: `${project.color}18`, color: project.color }}
        >
          <FolderKanban size={18} />
        </span>
        <button
          className="icon-button small"
          onClick={(e) => {
            e.stopPropagation();
            store.updateProject(project.id, { favorite: !project.favorite });
          }}
          aria-label="Favorite project"
        >
          {project.favorite ? "★" : "☆"}
        </button>
      </div>
      <div className="project-card-title">
        <h3>{project.name}</h3>
        <span className={`project-status ${project.status}`}>
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </div>
      <p>{project.description}</p>
      <div className="progress-meta">
        <span>
          {done} of {tasks.length || 0} tasks
        </span>
        <b>{progress}%</b>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress}%`, background: project.color }} />
      </div>
      <div className="project-card-foot">
        <div className="avatar-stack small-stack">
          {project.memberIds.slice(0, 3).map((mid) => {
            const m = store.members.find((x) => x.id === mid);
            return <span key={mid}>{m?.initials}</span>;
          })}
        </div>
        <span>
          <CalendarDays size={14} />
          {formatDate(project.endDate)}
        </span>
      </div>
    </article>
  );
}
function ProjectDetail() {
  const { projectId } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const project = store.projects.find((p) => p.id === projectId);
  const [view, setView] = useState<"board" | "list" | "calendar">("board");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | TaskPriority>("all");
  if (!project) return <NotFound app />;
  const tasks = store.tasks.filter(
    (t) =>
      t.projectId === project.id &&
      (!query || t.title.toLowerCase().includes(query.toLowerCase())) &&
      (filter === "all" || t.priority === filter),
  );
  const done = tasks.filter((t) => t.status === "done").length;
  return (
    <>
      <div className="detail-back">
        <button
          className="back-button"
          onClick={() => navigate("/app/projects")}
        >
          <ArrowLeft size={15} /> All projects
        </button>
      </div>
      <div className="project-detail-head">
        <div className="project-detail-title">
          <span
            className="project-symbol large"
            style={{ background: `${project.color}18`, color: project.color }}
          >
            <FolderKanban size={22} />
          </span>
          <div>
            <div className="eyebrow">
              Project / {PROJECT_STATUS_LABELS[project.status]}
            </div>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
          </div>
        </div>
        <div className="page-actions">
          <button
            className="button button-secondary"
            onClick={() =>
              document.dispatchEvent(
                new CustomEvent("open-project", { detail: project.id }),
              )
            }
          >
            <Edit3 size={15} /> Edit
          </button>
          <button
            className="button button-primary"
            onClick={() =>
              document.dispatchEvent(
                new CustomEvent("open-task", {
                  detail: { projectId: project.id },
                }),
              )
            }
          >
            <Plus size={16} /> New task
          </button>
        </div>
      </div>
      <div className="detail-metrics">
        <span>
          <strong>{tasks.length}</strong> tasks
        </span>
        <span>
          <strong>{done}</strong> completed
        </span>
        <span>
          <strong>
            {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%
          </strong>{" "}
          progress
        </span>
        <span>
          <CalendarDays size={15} />
          {formatDate(project.startDate)} – {formatDate(project.endDate)}
        </span>
        <div className="detail-members">
          {project.memberIds.map((mid) => (
            <span key={mid} className="mini-avatar">
              {store.members.find((m) => m.id === mid)?.initials}
            </span>
          ))}
        </div>
      </div>
      <div className="view-toolbar">
        <div className="view-switch">
          <button
            className={view === "board" ? "active" : ""}
            onClick={() => setView("board")}
          >
            <Grid2X2 size={15} /> Board
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            <List size={15} /> List
          </button>
          <button
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            <CalendarDays size={15} /> Calendar
          </button>
        </div>
        <div className="view-filters">
          <div className="search-input">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | TaskPriority)}
          >
            <option value="all">All priorities</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {view === "board" && <Kanban tasks={tasks} projectId={project.id} />}
      {view === "list" && <TaskList tasks={tasks} />}
      {view === "calendar" && (
        <CalendarView tasks={tasks} projectId={project.id} />
      )}
      <TaskModal />
      <ProjectModal />
    </>
  );
}
function Kanban({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  const store = useStore();
  const [dragging, setDragging] = useState<string | null>(null);
  const move = (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== status) store.updateTask(taskId, { status });
    setDragging(null);
  };
  return (
    <div className="kanban" onDragOver={(e) => e.preventDefault()}>
      {STATUS_ORDER.map((status) => {
        const column = tasks
          .filter((t) => t.status === status)
          .sort((a, b) => a.order - b.order);
        return (
          <section
            key={status}
            className={`kanban-column ${dragging ? "drag-active" : ""}`}
            onDrop={() => dragging && move(dragging, status)}
          >
            <div className="column-head">
              <span className={`column-indicator ${status}`} />
              <h3>{STATUS_LABELS[status]}</h3>
              <b>{column.length}</b>
              <button
                onClick={() =>
                  document.dispatchEvent(
                    new CustomEvent("open-task", {
                      detail: { projectId, status },
                    }),
                  )
                }
                aria-label={`Add task to ${STATUS_LABELS[status]}`}
              >
                <Plus size={15} />
              </button>
            </div>
            <div className="column-tasks">
              {column.map((task) => (
                <article
                  className="kanban-card"
                  key={task.id}
                  draggable
                  onDragStart={() => setDragging(task.id)}
                  onDragEnd={() => setDragging(null)}
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent("open-task", {
                        detail: { taskId: task.id },
                      }),
                    )
                  }
                >
                  <div className="kanban-card-top">
                    <span
                      className={`priority-dot ${task.priority}`}
                      title={PRIORITY_LABELS[task.priority]}
                    />
                    <button
                      className="icon-button tiny"
                      onClick={(e) => {
                        e.stopPropagation();
                        store.duplicateTask(task.id);
                      }}
                      title="Duplicate"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                  <h4>{task.title}</h4>
                  {task.description && <p>{task.description}</p>}
                  <div className="card-labels">
                    {task.labels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  <div className="kanban-card-foot">
                    <span>
                      {task.dueDate && (
                        <>
                          <Clock3 size={13} />
                          {formatDate(task.dueDate)}
                        </>
                      )}
                    </span>
                    <span className="card-spacer" />
                    {task.comments.length > 0 && (
                      <span>
                        <MessageCircle size={13} />
                        {task.comments.length}
                      </span>
                    )}
                    {task.assigneeId && (
                      <span className="mini-avatar">
                        {
                          store.members.find((m) => m.id === task.assigneeId)
                            ?.initials
                        }
                      </span>
                    )}
                  </div>
                  <label className="keyboard-status">
                    Move with keyboard
                    <select
                      aria-label={`Move ${task.title}`}
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        move(task.id, e.target.value as TaskStatus);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {STATUS_ORDER.map((option) => (
                        <option value={option} key={option}>
                          {STATUS_LABELS[option]}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
              {column.length === 0 && (
                <div className="empty-column">
                  <span>
                    <Plus size={16} />
                  </span>
                  <p>Drop tasks here</p>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
function TaskList({ tasks }: { tasks: Task[] }) {
  const [sort, setSort] = useState<"dueDate" | "priority" | "createdAt">(
    "dueDate",
  );
  const sorted = [...tasks].sort((a, b) =>
    String(a[sort] ?? "").localeCompare(String(b[sort] ?? "")),
  );
  return (
    <div className="panel task-list-panel">
      <div className="list-header">
        <span>{tasks.length} tasks</span>
        <label>
          Sort by{" "}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="createdAt">Created date</option>
          </select>
        </label>
      </div>
      <div className="task-table">
        <div className="task-table-row table-head">
          <span>Task</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Assignee</span>
          <span>Due</span>
          <span />
        </div>
        {sorted.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
        {!tasks.length && (
          <EmptyState
            title="No tasks match"
            text="Try clearing your search or filters."
          />
        )}
      </div>
    </div>
  );
}
function CalendarView({
  tasks,
  projectId,
}: {
  tasks: Task[];
  projectId: string;
}) {
  const [month, setMonth] = useState(new Date());
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((first + days) / 7) * 7 },
    (_, index) => {
      const day = index - first + 1;
      const date =
        day > 0 && day <= days
          ? `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          : "";
      return { day, date };
    },
  );
  return (
    <div className="calendar-panel panel">
      <div className="calendar-head">
        <button
          className="icon-button"
          onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
        >
          <ArrowLeft size={16} />
        </button>
        <h2>
          {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
        </h2>
        <button
          className="icon-button"
          onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
        >
          <ArrowRight size={16} />
        </button>
        <button
          className="button button-secondary today-button"
          onClick={() => setMonth(new Date())}
        >
          Today
        </button>
      </div>
      <div className="calendar-grid weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid days">
        {cells.map((cell, i) => {
          const dayTasks = tasks.filter((t) => t.dueDate === cell.date);
          return (
            <div
              className={`calendar-cell ${!cell.date ? "blank" : ""} ${cell.date === new Date().toISOString().slice(0, 10) ? "today" : ""}`}
              key={i}
            >
              <span>{cell.day > 0 && cell.day <= days ? cell.day : ""}</span>
              {dayTasks.map((t) => (
                <button
                  key={t.id}
                  className={`calendar-task ${t.status}`}
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent("open-task", {
                        detail: { taskId: t.id },
                      }),
                    )
                  }
                >
                  <i className={`priority-dot ${t.priority}`} />
                  {t.title}
                </button>
              ))}
              {cell.date && (
                <button
                  className="calendar-add"
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent("open-task", {
                        detail: { projectId, dueDate: cell.date },
                      }),
                    )
                  }
                >
                  <Plus size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function MyTasks() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const tasks = store.tasks.filter(
    (t) =>
      t.workspaceId === store.activeWorkspaceId &&
      t.assigneeId === store.user.id &&
      (status === "all" || t.status === status) &&
      t.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="Workspace / My tasks"
        title="My tasks"
        description="Keep your personal queue clear and actionable."
        action={
          <button
            className="button button-primary"
            onClick={() =>
              document.dispatchEvent(
                new CustomEvent("open-task", { detail: {} }),
              )
            }
          >
            <Plus size={16} /> New task
          </button>
        }
      />
      <div className="toolbar task-toolbar">
        <div className="search-input">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your tasks"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option value={s} key={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="panel task-list-panel">
        <div className="list-header">
          <span>{tasks.length} assigned tasks</span>
          <span className="muted">Sorted by due date</span>
        </div>
        {tasks.length ? (
          tasks
            .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
            .map((t) => <TaskRow key={t.id} task={t} />)
        ) : (
          <EmptyState
            icon={<CheckCircle2 size={20} />}
            title="Your queue is clear"
            text="New work assigned to you will show up here."
          />
        )}
      </div>
      <TaskModal />
    </>
  );
}
function MembersPage() {
  const store = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const workspaceMembers = store.members.filter(
    (m) => m.workspaceId === store.activeWorkspaceId,
  );
  return (
    <>
      <PageHeader
        eyebrow="Workspace / People"
        title="Members"
        description="A lightweight view of who is shaping the work."
        action={
          <button
            className="button button-primary"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={16} /> Add member
          </button>
        }
      />
      <div className="member-summary">
        <div>
          <Users size={18} />
          <span>
            <strong>{workspaceMembers.length}</strong>
            <small>people in workspace</small>
          </span>
        </div>
        <div>
          <Activity size={18} />
          <span>
            <strong>{store.tasks.filter((t) => t.assigneeId).length}</strong>
            <small>assigned tasks</small>
          </span>
        </div>
        <div>
          <CheckCircle2 size={18} />
          <span>
            <strong>
              {store.tasks.filter((t) => t.status === "done").length}
            </strong>
            <small>completed tasks</small>
          </span>
        </div>
      </div>
      <div className="panel member-panel">
        <div className="member-table">
          <div className="member-row member-head">
            <span>Person</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Open tasks</span>
            <span />
          </div>
          {workspaceMembers.map((member) => (
            <div className="member-row" key={member.id}>
              <span className="member-person">
                <span className="large-avatar">{member.initials}</span>
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                </span>
              </span>
              <select
                value={member.role}
                onChange={(e) =>
                  store.updateMember(member.id, {
                    role: e.target.value as WorkspaceMember["role"],
                  })
                }
                disabled={member.id === store.user.id}
              >
                <option>Owner</option>
                <option>Admin</option>
                <option>Member</option>
                <option>Viewer</option>
              </select>
              <span className="muted">{formatDate(member.joinedAt)}</span>
              <span>
                {
                  store.tasks.filter(
                    (t) => t.assigneeId === member.id && t.status !== "done",
                  ).length
                }{" "}
                active
              </span>
              <button
                className="icon-button"
                disabled={member.id === store.user.id}
                onClick={() => store.removeMember(member.id)}
                aria-label={`Remove ${member.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
      {showAdd && <MemberModal close={() => setShowAdd(false)} />}
    </>
  );
}
function MemberModal({ close }: { close: () => void }) {
  const store = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceMember["role"]>("Member");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name && email) {
      store.addMember({
        name,
        email,
        initials: initials(name),
        role,
        workspaceId: store.activeWorkspaceId,
      });
      close();
    }
  };
  return (
    <Modal title="Add a demo member" close={close}>
      <form className="modal-form" onSubmit={submit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Alex Morgan"
          />
        </label>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            placeholder="alex@flowboard.dev"
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceMember["role"])}
          >
            <option>Admin</option>
            <option>Member</option>
            <option>Viewer</option>
          </select>
        </label>
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={close}
          >
            Cancel
          </button>
          <button className="button button-primary">Add member</button>
        </div>
      </form>
    </Modal>
  );
}
function NotificationsPage() {
  const store = useStore();
  const items = store.notifications.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <>
      <PageHeader
        eyebrow="Workspace / Inbox"
        title="Inbox"
        description="Signals from the work that needs your attention."
        action={
          items.some((n) => !n.read) ? (
            <button
              className="button button-secondary"
              onClick={store.markAllRead}
            >
              Mark all read
            </button>
          ) : undefined
        }
      />
      <div className="panel notifications-panel">
        {items.length ? (
          items.map((n) => (
            <button
              className={`notification-row ${n.read ? "" : "unread"}`}
              key={n.id}
              onClick={() => {
                store.markNotificationRead(n.id);
                if (n.taskId)
                  document.dispatchEvent(
                    new CustomEvent("open-task", {
                      detail: { taskId: n.taskId },
                    }),
                  );
              }}
            >
              <span className={`notification-icon ${n.type}`}>
                <Bell size={16} />
              </span>
              <span>
                <strong>{n.title}</strong>
                <small>{n.body}</small>
                <time>{relative(n.createdAt)}</time>
              </span>
              {!n.read && <i className="unread-dot" />}
            </button>
          ))
        ) : (
          <EmptyState
            icon={<Bell size={20} />}
            title="All quiet here"
            text="You will see task and project updates here."
          />
        )}
      </div>
      <TaskModal />
    </>
  );
}
function SettingsPage() {
  const store = useStore();
  const [workspaceName, setWorkspaceName] = useState(
    store.workspaces.find((w) => w.id === store.activeWorkspaceId)?.name ?? "",
  );
  const workspace = store.workspaces.find(
    (w) => w.id === store.activeWorkspaceId,
  );
  return (
    <>
      <PageHeader
        eyebrow="Workspace / Preferences"
        title="Settings"
        description="Shape FlowBoard around the way you work."
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          <a className="active" href="#profile">
            Profile
          </a>
          <a href="#workspace">Workspace</a>
          <a href="#preferences">Preferences</a>
          <a href="#data">Demo data</a>
        </nav>
        <div className="settings-content">
          <section className="settings-section" id="profile">
            <div className="settings-section-head">
              <div>
                <h2>Profile</h2>
                <p>Your demo identity shown across FlowBoard.</p>
              </div>
              <button
                className="button button-secondary"
                onClick={() =>
                  alert("Profile changes are available in the demo form.")
                }
              >
                Edit profile
              </button>
            </div>
            <div className="profile-card">
              <span className="profile-avatar">{store.user.initials}</span>
              <span>
                <strong>{store.user.name}</strong>
                <small>{store.user.email}</small>
              </span>
              <span className="profile-tag">Demo account</span>
            </div>
          </section>
          <section className="settings-section" id="workspace">
            <div className="settings-section-head">
              <div>
                <h2>Workspace</h2>
                <p>Keep your workspace identity up to date.</p>
              </div>
              <button
                className="button button-secondary"
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("open-workspace"))
                }
              >
                <Plus size={15} /> New workspace
              </button>
            </div>
            <label>
              Workspace name
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onBlur={() =>
                  workspace &&
                  store.updateWorkspace(workspace.id, { name: workspaceName })
                }
              />
            </label>
            <label>
              Workspace description
              <textarea
                defaultValue={workspace?.description}
                onBlur={(e) =>
                  workspace &&
                  store.updateWorkspace(workspace.id, {
                    description: e.target.value,
                  })
                }
              />
            </label>
            <div className="workspace-actions">
              <span className="muted">Active workspace: {workspace?.name}</span>
              {store.workspaces.length > 1 && (
                <button
                  className="button button-danger ghost"
                  onClick={() => {
                    if (
                      workspace &&
                      confirm(
                        `Delete ${workspace.name}? This removes its demo data.`,
                      )
                    )
                      store.deleteWorkspace(workspace.id);
                  }}
                >
                  <Trash2 size={14} /> Delete workspace
                </button>
              )}
            </div>
          </section>
          <section className="settings-section" id="preferences">
            <div className="settings-section-head">
              <div>
                <h2>Preferences</h2>
                <p>Choose how FlowBoard feels and communicates.</p>
              </div>
            </div>
            <div className="preference-row">
              <span>
                <strong>Appearance</strong>
                <small>Theme applies across this browser.</small>
              </span>
              <div className="theme-options">
                {(["light", "dark", "system"] as const).map((theme) => (
                  <button
                    key={theme}
                    className={store.settings.theme === theme ? "active" : ""}
                    onClick={() => store.updateSettings({ theme })}
                  >
                    {theme === "light" ? (
                      <Sun size={15} />
                    ) : theme === "dark" ? (
                      <Moon size={15} />
                    ) : (
                      <Command size={15} />
                    )}{" "}
                    {theme[0].toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="preference-row">
              <span>
                <strong>Email notifications</strong>
                <small>Receive simulated updates in your inbox.</small>
              </span>
              <button
                className={`toggle ${store.settings.emailNotifications ? "on" : ""}`}
                onClick={() =>
                  store.updateSettings({
                    emailNotifications: !store.settings.emailNotifications,
                  })
                }
              >
                <i />
              </button>
            </div>
            <div className="preference-row">
              <span>
                <strong>Compact density</strong>
                <small>Fit more work into each screen.</small>
              </span>
              <button
                className={`toggle ${store.settings.compactMode ? "on" : ""}`}
                onClick={() =>
                  store.updateSettings({
                    compactMode: !store.settings.compactMode,
                  })
                }
              >
                <i />
              </button>
            </div>
          </section>
          <section className="settings-section danger" id="data">
            <div className="settings-section-head">
              <div>
                <h2>Demo data</h2>
                <p>
                  Reset all changes and return to the original demo workspace.
                </p>
              </div>
              <button
                className="button button-danger"
                onClick={() => {
                  if (confirm("Reset all FlowBoard demo data?")) store.reset();
                }}
              >
                Reset demo data
              </button>
            </div>
            <div className="notice">
              <CircleHelp size={16} />
              <span>
                FlowBoard stores demo data in this browser’s local storage. It
                is designed for portfolio exploration, not production security.
              </span>
            </div>
          </section>
        </div>
      </div>
      <WorkspaceModal />
    </>
  );
}
function WorkspaceModal() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#4f46e5");
  useCustomEvent("open-workspace", () => setOpen(true));
  const close = () => setOpen(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    store.createWorkspace({ name: name.trim(), description, color });
    setName("");
    setDescription("");
    close();
  };
  if (!open) return null;
  return (
    <Modal title="Create a workspace" close={close}>
      <form className="modal-form" onSubmit={submit}>
        <label>
          Workspace name
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Design Guild"
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What belongs in this workspace?"
            rows={3}
          />
        </label>
        <label>
          Accent color
          <div className="color-palette">
            {["#4f46e5", "#0891b2", "#d97706", "#16a34a", "#db2777"].map(
              (c) => (
                <button
                  type="button"
                  key={c}
                  className={color === c ? "selected" : ""}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Use ${c}`}
                />
              ),
            )}
          </div>
        </label>
        <div className="modal-actions">
          <span className="action-spacer" />
          <button
            type="button"
            className="button button-secondary"
            onClick={close}
          >
            Cancel
          </button>
          <button className="button button-primary">Create workspace</button>
        </div>
      </form>
    </Modal>
  );
}
function Modal({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);
  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function useCustomEvent(name: string, handler: (event: CustomEvent) => void) {
  useEffect(() => {
    const fn = (event: Event) => handler(event as CustomEvent);
    document.addEventListener(name, fn);
    return () => document.removeEventListener(name, fn);
  }, [name, handler]);
}
function TaskModal() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState<string>();
  const [projectId, setProjectId] = useState<string>();
  const [initialStatus, setInitialStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState<string>();
  const openHandler = (e: CustomEvent) => {
    setTaskId(e.detail?.taskId);
    setProjectId(e.detail?.projectId);
    setInitialStatus(e.detail?.status ?? "todo");
    setDueDate(e.detail?.dueDate);
    setOpen(true);
  };
  useCustomEvent("open-task", openHandler);
  const task = store.tasks.find((t) => t.id === taskId);
  const project =
    store.projects.find((p) => p.id === (task?.projectId ?? projectId)) ??
    store.projects.find((p) => p.workspaceId === store.activeWorkspaceId);
  const close = () => setOpen(false);
  if (!open || !project) return null;
  return (
    <TaskEditor
      task={task}
      project={project}
      initialStatus={initialStatus}
      initialDueDate={dueDate}
      close={close}
    />
  );
}
function TaskEditor({
  task,
  project,
  initialStatus,
  initialDueDate,
  close,
}: {
  task?: Task;
  project: Project;
  initialStatus: TaskStatus;
  initialDueDate?: string;
  close: () => void;
}) {
  const store = useStore();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? initialStatus,
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "medium",
  );
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? initialDueDate ?? "");
  const [labels, setLabels] = useState(task?.labels.join(", ") ?? "");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const save = (e: FormEvent) => {
    e.preventDefault();
    const validation = taskFormSchema.safeParse({
      title,
      description,
      status,
      priority,
      projectId: project.id,
      assigneeId,
      dueDate,
      labels,
      estimate: "",
    });
    if (!validation.success)
      return setError(
        validation.error.issues[0]?.message ?? "Check the form and try again.",
      );
    const patch = {
      title: title.trim(),
      description,
      status,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      labels: labels
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };
    if (task) store.updateTask(task.id, patch);
    else store.createTask({ ...patch, projectId: project.id });
    close();
  };
  const addComment = (e: FormEvent) => {
    e.preventDefault();
    if (task && comment.trim()) {
      store.addComment(task.id, comment.trim());
      setComment("");
    }
  };
  return (
    <Modal title={task ? "Task details" : "Create a task"} close={close} wide>
      <form className="task-editor" onSubmit={save}>
        <div className="task-editor-main">
          <label>
            Task title
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to move forward?"
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add context, links, or acceptance criteria..."
            />
          </label>
          <div className="form-grid">
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Assignee
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {store.members
                  .filter((m) => m.workspaceId === project.workspaceId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          </div>
          <label>
            Labels <small className="label-help">Separate with commas</small>
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="Design, Frontend"
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button
              type="button"
              className="button button-danger ghost"
              onClick={() => {
                if (task && confirm("Delete this task?")) {
                  store.deleteTask(task.id);
                  close();
                }
              }}
            >
              {task && (
                <>
                  <Trash2 size={15} /> Delete
                </>
              )}
            </button>
            <span className="action-spacer" />
            <button
              type="button"
              className="button button-secondary"
              onClick={close}
            >
              Cancel
            </button>
            <button className="button button-primary">
              {task ? "Save changes" : "Create task"}
            </button>
          </div>
        </div>
        {task && (
          <aside className="task-editor-side">
            <div className="side-block">
              <h3>Activity</h3>
              {store.activities
                .filter((a) => a.taskId === task.id)
                .slice(0, 4)
                .map((a) => (
                  <ActivityRow
                    key={a.id}
                    activity={a.message}
                    date={relative(a.createdAt)}
                    actor={store.members.find((m) => m.id === a.actorId)}
                  />
                ))}
              {!store.activities.some((a) => a.taskId === task.id) && (
                <p className="muted">No activity yet.</p>
              )}
            </div>
            <div className="side-block">
              <h3>
                Checklist{" "}
                <span>
                  {task.checklist.filter((x) => x.completed).length}/
                  {task.checklist.length}
                </span>
              </h3>
              {task.checklist.map((item) => (
                <label className="checklist-item" key={item.id}>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() =>
                      store.updateTask(task.id, {
                        checklist: task.checklist.map((x) =>
                          x.id === item.id
                            ? { ...x, completed: !x.completed }
                            : x,
                        ),
                      })
                    }
                  />
                  <span>{item.title}</span>
                </label>
              ))}
              {!task.checklist.length && (
                <p className="muted">No checklist items.</p>
              )}
            </div>
            <div className="side-block">
              <h3>Comments</h3>
              {task.comments.map((c) => (
                <div className="comment" key={c.id}>
                  <span className="mini-avatar">
                    {store.members.find((m) => m.id === c.authorId)?.initials}
                  </span>
                  <p>
                    <strong>
                      {store.members.find((m) => m.id === c.authorId)?.name}
                    </strong>
                    <span>{c.body}</span>
                    <small>{relative(c.createdAt)}</small>
                  </p>
                </div>
              ))}
              <form className="comment-form" onSubmit={addComment}>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                />
                <button className="icon-button" disabled={!comment.trim()}>
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          </aside>
        )}
      </form>
    </Modal>
  );
}
function ProjectModal() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>();
  const openHandler = (e: CustomEvent) => {
    setProjectId(e.detail);
    setOpen(true);
  };
  useCustomEvent("open-project", openHandler);
  const project = store.projects.find((p) => p.id === projectId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [color, setColor] = useState("#4f46e5");
  const [endDate, setEndDate] = useState("");
  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setStatus(project?.status ?? "planning");
      setColor(project?.color ?? "#4f46e5");
      setEndDate(project?.endDate ?? "");
    }
  }, [
    open,
    project?.color,
    project?.description,
    project?.endDate,
    project?.name,
    project?.status,
    project?.id,
  ]);
  const close = () => setOpen(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const startDate =
      project?.startDate ?? new Date().toISOString().slice(0, 10);
    const parsed = projectFormSchema.safeParse({
      name,
      description,
      status,
      color,
      icon: "folder",
      startDate,
      endDate:
        endDate || new Date(Date.now() + 2592000000).toISOString().slice(0, 10),
      memberIds: project?.memberIds ?? [store.user.id],
    });
    if (!parsed.success) return;
    if (project)
      store.updateProject(project.id, {
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
        color: parsed.data.color,
        endDate: parsed.data.endDate,
      });
    else
      store.createProject({
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
        color: parsed.data.color,
        icon: parsed.data.icon,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
      });
    close();
  };
  if (!open) return null;
  return (
    <Modal title={project ? "Edit project" : "Create a project"} close={close}>
      <form className="modal-form" onSubmit={submit}>
        <label>
          Project name
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website refresh"
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does this project make possible?"
          />
        </label>
        <div className="form-grid">
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            End date
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
        <label>
          Accent color
          <div className="color-palette">
            {[
              "#4f46e5",
              "#0891b2",
              "#d97706",
              "#16a34a",
              "#db2777",
              "#7c3aed",
            ].map((c) => (
              <button
                type="button"
                key={c}
                className={color === c ? "selected" : ""}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Use ${c}`}
              />
            ))}
          </div>
        </label>
        <div className="modal-actions">
          {project && (
            <button
              type="button"
              className="button button-danger ghost"
              onClick={() => {
                if (confirm("Delete this project and its tasks?")) {
                  store.deleteProject(project.id);
                  close();
                }
              }}
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
          <span className="action-spacer" />
          <button
            type="button"
            className="button button-secondary"
            onClick={close}
          >
            Cancel
          </button>
          <button className="button button-primary">
            {project ? "Save project" : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function GlobalSearch() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  useCustomEvent("open-search", () => setOpen(true));
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const results = [
    ...store.tasks
      .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5),
    ...store.projects
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3),
  ];
  if (!open) return null;
  return (
    <div
      className="search-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="global-search">
        <div className="global-search-input">
          <Search size={18} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and projects..."
          />
          <kbd>Esc</kbd>
        </div>
        <div className="search-results">
          {results.length ? (
            results.map((item) =>
              "title" in item ? (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    document.dispatchEvent(
                      new CustomEvent("open-task", {
                        detail: { taskId: item.id },
                      }),
                    );
                  }}
                >
                  <ClipboardList size={16} />
                  <span>
                    {item.title}
                    <small>Task · {STATUS_LABELS[item.status]}</small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    navigate(`/app/projects/${item.id}`);
                  }}
                >
                  <FolderKanban size={16} />
                  <span>
                    {item.name}
                    <small>Project</small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ),
            )
          ) : (
            <EmptyState title="No matches" text="Try another search term." />
          )}
        </div>
        <div className="search-foot">
          <span>
            <kbd>↑↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
          <span>
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
function EmptyState({
  icon,
  title,
  text,
}: {
  icon?: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-icon">{icon}</span>}
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
function NotFound({ app = false }: { app?: boolean }) {
  return app ? (
    <div className="not-found">
      <span className="empty-icon">
        <FolderKanban size={21} />
      </span>
      <h2>Nothing to see here</h2>
      <p>The page or project you requested does not exist.</p>
      <Link to="/app" className="button button-primary">
        Back to overview
      </Link>
    </div>
  ) : (
    <div className="not-found full">
      <Sparkles size={28} />
      <h1>Page not found</h1>
      <Link to="/" className="button button-primary">
        Return home
      </Link>
    </div>
  );
}
export default App;
