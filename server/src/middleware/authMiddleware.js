import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Authentication required" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ success: false, message: "Authentication is not configured" });
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id name email");
    if (!user) return res.status(401).json({ success: false, message: "User no longer exists" });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.name === "TokenExpiredError" ? "Session expired. Please log in again." : "Invalid authentication token" });
  }
}
