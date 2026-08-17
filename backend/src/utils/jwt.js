import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "campuscanteen_jwt_secret_key_2026";

export function signToken(userOrId) {
  const userId = typeof userOrId === "object" && userOrId !== null ? userOrId.id : userOrId;
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
