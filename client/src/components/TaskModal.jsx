import { useEffect, useState } from "react";
import { X } from "lucide-react";

const emptyForm = { title: "", description: "", status: "Pending", priority: "Medium", dueDate: "" };

export default function TaskModal({ open, task, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(task ? {
        title: task.title || "",
        description: task.description || "",
        status: task.status || "Pending",
        priority: task.priority || "Medium",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
      } : emptyForm);
      setError("");
    }
  }, [open, task]);

  if (!open) return null;
  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Please enter a task title.");
    setError("");
    try { await onSave({ ...form, title: form.title.trim(), dueDate: form.dueDate || null }); }
    catch (err) { setError(err); }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal">
        <div className="modal-head">
          <div><span className="eyebrow">{task ? "UPDATE TASK" : "NEW TASK"}</span><h2>{task ? "Edit task" : "Create a task"}</h2></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button>
        </div>
        <form onSubmit={submit}>
          <label>Task title <span className="required">*</span><input autoFocus name="title" value={form.title} onChange={change} maxLength="120" placeholder="e.g. Prepare project presentation" /></label>
          <label>Description <textarea name="description" value={form.description} onChange={change} rows="3" maxLength="1000" placeholder="Add a few details..." /></label>
          <div className="form-grid">
            <label>Status<select name="status" value={form.status} onChange={change}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>
            <label>Priority<select name="priority" value={form.priority} onChange={change}><option>High</option><option>Medium</option><option>Low</option></select></label>
          </div>
          <label>Due date<input type="date" name="dueDate" value={form.dueDate} onChange={change}/></label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button disabled={saving} className="btn btn-primary">{saving ? "Saving..." : task ? "Save changes" : "Create task"}</button></div>
        </form>
      </section>
    </div>
  );
}
