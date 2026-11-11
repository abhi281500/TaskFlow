import { CalendarDays, Pencil, Trash2 } from "lucide-react";

function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Converts a status string to a CSS-safe class suffix, e.g. "In Progress" → "in-progress". */
function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString()) && task.status !== "Completed";
  return (
    <article className="task-card">
      <div className="task-main">
        <div className="task-title-row">
          <h3 className={task.status === "Completed" ? "completed-title" : ""}>{task.title}</h3>
          <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
        </div>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span className={overdue ? "due overdue" : "due"}><CalendarDays size={14}/>{formatDate(task.dueDate)}{overdue ? " · Overdue" : ""}</span>
          <span className="created">Created {formatDate(task.createdAt)}</span>
        </div>
      </div>
      <div className="task-actions">
        <select
          aria-label="Change task status"
          className={`status-select status-${statusClass(task.status)}`}
          value={task.status}
          onChange={e => onStatusChange(task, e.target.value)}
        >
          <option>Pending</option><option>In Progress</option><option>Completed</option>
        </select>
        <button className="icon-btn" title="Edit task" onClick={() => onEdit(task)}><Pencil size={16}/></button>
        <button className="icon-btn danger-hover" title="Delete task" onClick={() => onDelete(task)}><Trash2 size={16}/></button>
      </div>
    </article>
  );
}
