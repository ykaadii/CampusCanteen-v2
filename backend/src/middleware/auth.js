import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

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
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, campusId: true },
    });

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Usage: requireRole("ADMIN") or requireRole("ADMIN", "CANTEEN_STAFF")
// Must run after requireAuth.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
