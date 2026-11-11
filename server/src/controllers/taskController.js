import mongoose from "mongoose";
import Task from "../models/Task.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const validId = id => mongoose.Types.ObjectId.isValid(id);

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;
  if (typeof title !== "string" || !title.trim()) return res.status(400).json({ success: false, message: "Title is required" });
  const task = await Task.create({ user: req.user._id, title: title.trim(), description, status, priority, dueDate: dueDate || null });
  res.status(201).json({ success: true, message: "Task created successfully", data: task });
});

export const getTasks = asyncHandler(async (req, res) => {
  const { search = "", status, priority, sort = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;
  const filter = { user: req.user._id };
  if (search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: escaped, $options: "i" };
  }
  if (status && status !== "All") filter.status = status;
  if (priority && priority !== "All") filter.priority = priority;
  const allowedSort = ["createdAt", "dueDate", "title", "priority"];
  const sortField = allowedSort.includes(sort) ? sort : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ [sortField]: sortOrder, _id: -1 }).skip((currentPage - 1) * pageSize).limit(pageSize),
    Task.countDocuments(filter)
  ]);
  res.json({ success: true, data: tasks, pagination: { total, page: currentPage, limit: pageSize, pages: Math.ceil(total / pageSize) } });
});

export const getTaskCounts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [total, pending, inProgress, completed] = await Promise.all([
    Task.countDocuments({ user: userId }),
    Task.countDocuments({ user: userId, status: "Pending" }),
    Task.countDocuments({ user: userId, status: "In Progress" }),
    Task.countDocuments({ user: userId, status: "Completed" })
  ]);
  res.json({ success: true, data: { total, pending, inProgress, completed } });
});

export const getTaskById = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task ID" });
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: "Task not found" });
  res.json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task ID" });
  const updates = {};
  for (const key of ["title", "description", "status", "priority", "dueDate"]) if (key in req.body) updates[key] = req.body[key];
  if ("title" in updates) {
    if (typeof updates.title !== "string" || !updates.title.trim()) return res.status(400).json({ success: false, message: "Title is required" });
    updates.title = updates.title.trim();
  }
  // Empty string or null dueDate explicitly clears the due date field.
  if ("dueDate" in updates && (updates.dueDate === "" || updates.dueDate === null)) updates.dueDate = null;
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updates, { new: true, runValidators: true });
  if (!task) return res.status(404).json({ success: false, message: "Task not found" });
  res.json({ success: true, message: "Task updated successfully", data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task ID" });
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: "Task not found" });
  res.json({ success: true, message: "Task deleted successfully" });
});
