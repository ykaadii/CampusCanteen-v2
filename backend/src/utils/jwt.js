import jwt from "jsonwebtoken";

export function signToken(userOrId) {
  const userId = typeof userOrId === "object" && userOrId !== null ? userOrId.id : userOrId;
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
