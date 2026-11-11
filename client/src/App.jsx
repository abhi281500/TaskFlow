import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Circle, Clock3, ListTodo, LogOut, Plus, Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { taskApi, authApi, getApiError } from "./api/tasks";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import AuthPage from "./components/AuthPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [counts, setCounts] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Only commit search to the API query after 300ms without typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const token = localStorage.getItem("taskflow_token");
    if (!token) { setAuthChecking(false); return; }
    authApi.me()
      .then(({ data }) => setUser(data.user))
      .catch(err => {
        // Only remove the token when the server explicitly rejects it (401).
        // Network errors (err.code === "ERR_NETWORK") should not wipe the token.
        if (err.response?.status === 401) localStorage.removeItem("taskflow_token");
      })
      .finally(() => setAuthChecking(false));
  }, []);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await taskApi.getAll({ search, status, priority, sort, order, page, limit: 10 });
      setTasks(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiError(err));
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, [user, search, status, priority, sort, order, page]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Fetch accurate per-status counts from the dedicated /tasks/counts endpoint
  // so they are never limited by pagination and are always correct.
  const loadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await taskApi.getCounts();
      setCounts({
        total: data.data.total,
        pending: data.data.pending,
        inProgress: data.data.inProgress,
        completed: data.data.completed
      });
    } catch {
      // Count failures are non-critical — do not surface to the user.
    }
  }, [user]);

  // Reload counts whenever the user changes or after any mutating operation.
  useEffect(() => { loadCounts(); }, [loadCounts]);

  function logout() {
    localStorage.removeItem("taskflow_token");
    setUser(null);
    setTasks([]);
    setPage(1);
  }
  function updateFilter(setter, value) { setter(value); setPage(1); }
  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(task) { setEditing(task); setModalOpen(true); }

  // Optimistic edit: update local state first, then roll back if server rejects it.
  async function saveTask(payload) {
    setSaving(true);
    if (editing) {
      const previousTasks = tasks;
      setTasks(current =>
        current.map(item =>
          item._id === editing._id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item
        )
      );
      setModalOpen(false);
      try {
        const { data } = await taskApi.update(editing._id, payload);
        setTasks(current => current.map(item => item._id === editing._id ? data.data : item));
        toast.success("Task updated successfully");
        await Promise.all([loadCounts(), loadTasks()]);
      } catch (err) {
        setTasks(previousTasks);
        const message = getApiError(err);
        toast.error(message);
        throw message;
      } finally { setSaving(false); }
      return;
    }
    try {
      await taskApi.create(payload);
      setModalOpen(false);
      setPage(1);
      toast.success("Task created successfully");
      await Promise.all([loadTasks(), loadCounts()]);
    } catch (err) {
      const message = getApiError(err);
      toast.error(message);
      throw message;
    } finally { setSaving(false); }
  }

  // Optimistic delete with exact rollback on failure.
  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This action cannot be undone.`)) return;
    const previousTasks = tasks;
    const previousPagination = pagination;
    setTasks(current => current.filter(item => item._id !== task._id));
    setPagination(current => ({ ...current, total: Math.max(0, current.total - 1) }));
    try {
      await taskApi.remove(task._id);
      toast.success("Task deleted successfully");
      // If the last task on a non-first page was deleted, go back a page.
      // Otherwise just refresh the current page and counts.
      if (previousTasks.length === 1 && page > 1) {
        setPage(current => current - 1);
      } else {
        await Promise.all([loadTasks(), loadCounts()]);
      }
    } catch (err) {
      setTasks(previousTasks);
      setPagination(previousPagination);
      toast.error(getApiError(err));
    }
  }

  // Optimistic status update with rollback if the API fails.
  async function changeStatus(task, nextStatus) {
    const previousTasks = tasks;
    setTasks(current => current.map(item => item._id === task._id ? { ...item, status: nextStatus } : item));
    try {
      const { data } = await taskApi.update(task._id, { status: nextStatus });
      setTasks(current => current.map(item => item._id === task._id ? data.data : item));
      toast.success("Task status updated");
      await loadCounts();
    } catch (err) {
      setTasks(previousTasks);
      toast.error(getApiError(err));
    }
  }

  if (authChecking) return <main className="auth-shell"><div className="state"><span className="spinner"/><p>Checking your session...</p></div></main>;
  if (!user) return <AuthPage onAuthenticated={setUser}/>;

  const hasFilters = search || status !== "All" || priority !== "All";
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark"><ListTodo size={21}/></span><span>task<span className="brand-accent">flow</span></span></a>
        <div className="user-menu"><span className="user-greeting"><UserRound size={15}/>{user.name}</span><button className="btn btn-ghost logout-btn" onClick={logout}><LogOut size={15}/> Logout</button></div>
      </header>
      <section className="content">
        <div className="page-heading">
          <div><span className="eyebrow">PRIVATE WORKSPACE</span><h1>My tasks</h1><p>Keep your work organised and moving forward.</p></div>
          <button className="btn btn-primary add-btn" onClick={openCreate}><Plus size={18}/> New task</button>
        </div>
        <section className="stats-grid">
          <Stat icon={<ListTodo/>} label="Total tasks" value={counts.total} tone="blue"/>
          <Stat icon={<Circle/>} label="Pending" value={counts.pending} tone="amber"/>
          <Stat icon={<Clock3/>} label="In progress" value={counts.inProgress} tone="violet"/>
          <Stat icon={<CheckCircle2/>} label="Completed" value={counts.completed} tone="green"/>
        </section>
        <section className="tasks-panel">
          <div className="panel-heading"><div><h2>All tasks</h2><span>{pagination.total} {pagination.total === 1 ? "task" : "tasks"} found</span></div><SlidersHorizontal size={18}/></div>
          <div className="toolbar">
            <div className="search-box"><Search size={17}/><input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by task title..." aria-label="Search tasks"/></div>
            <select aria-label="Filter by status" value={status} onChange={e => updateFilter(setStatus,e.target.value)}><option value="All">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select>
            <select aria-label="Filter by priority" value={priority} onChange={e => updateFilter(setPriority,e.target.value)}><option value="All">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
            <select aria-label="Sort field" value={sort} onChange={e => updateFilter(setSort,e.target.value)}><option value="createdAt">Creation date</option><option value="dueDate">Due date</option><option value="title">Title</option><option value="priority">Priority</option></select>
            <select aria-label="Sort order" value={order} onChange={e => updateFilter(setOrder,e.target.value)}><option value="desc">Descending</option><option value="asc">Ascending</option></select>
          </div>
          {hasFilters && <button className="clear-filters" onClick={() => {setSearchInput("");setSearch("");setStatus("All");setPriority("All");setPage(1);}}><X size={13}/> Clear filters</button>}
          {error && <div className="error-banner"><span>{error}</span><button onClick={loadTasks}>Retry</button></div>}
          <div className="task-list">
            {loading ? <div className="state"><span className="spinner"/><p>Loading your tasks...</p></div>
              : error ? <div className="state"><p>We couldn&apos;t load your tasks.</p></div>
              : tasks.length === 0 ? <div className="state empty"><span className="empty-icon"><ListTodo size={25}/></span><h3>{hasFilters ? "No matching tasks" : "No tasks yet"}</h3><p>{hasFilters ? "Try changing your search or filters." : "Create your first task and start getting things done."}</p>{!hasFilters && <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> Create your first task</button>}</div>
              : tasks.map(task => <TaskCard key={task._id} task={task} onEdit={openEdit} onDelete={deleteTask} onStatusChange={changeStatus}/>)}
          </div>
          <div className="pagination">
            <span>Page {pagination.pages ? pagination.page : 0} of {pagination.pages} · {pagination.total} total</span>
            <div><button className="page-btn" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/> Previous</button><button className="page-btn" disabled={page >= pagination.pages || loading} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={16}/></button></div>
          </div>
        </section>
        <footer>Built with React, Express &amp; MongoDB <span>·</span> TaskFlow</footer>
      </section>
      <TaskModal open={modalOpen} task={editing} onClose={() => setModalOpen(false)} onSave={saveTask} saving={saving}/>
    </main>
  );
}
function Stat({ icon, label, value, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><span>{label}</span><strong>{value}</strong></div></article>;
}
