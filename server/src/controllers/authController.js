import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function signToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing");
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}
function sendAuth(user, res, status = 200) {
  return res.status(status).json({
    success: true, message: status === 201 ? "Account created successfully" : "Login successful",
    token: signToken(user._id.toString()),
    user: { id: user._id, name: user.name, email: user.email }
  });
}
export const register = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body.password;
  if (!name || !email || typeof password !== "string") return res.status(400).json({ success: false, message: "Name, email and password are required" });
  if (name.length < 2 || name.length > 60) return res.status(400).json({ success: false, message: "Name must be 2–60 characters" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: "Invalid email address" });
  if (password.length < 8) return res.status(400).json({ success: false, message: "Password must contain at least 8 characters" });
  if (await User.findOne({ email })) return res.status(409).json({ success: false, message: "Email is already registered" });
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashedPassword });
  return sendAuth(user, res, 201);
});
export const login = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body.password;
  if (!email || typeof password !== "string" || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
  const user = await User.findOne({ email }).select("+password");
  const valid = user ? await bcrypt.compare(password, user.password) : false;
  if (!valid) return res.status(401).json({ success: false, message: "Invalid email or password" });
  return sendAuth(user, res);
});
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email } });
});
