import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "campuscanteen_jwt_secret_key_2026";

// Verifies the JWT from the Authorization header, loads the matching user
// from the database (so we always have fresh role/status data, not just
// whatever was true when the token was issued), and attaches it as
// req.user for downstream handlers.
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // Safely extract string id whether payload.userId is string or object
    const userId = typeof payload.userId === "object" && payload.userId !== null
      ? payload.userId.id
      : payload.userId;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, name: true, email: true, role: true, campusId: true },
    });

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Usage: requireRole("ADMIN") or requireRole("ADMIN", "CANTEEN_STAFF")
// Must run after requireAuth.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    next();
  };
}
