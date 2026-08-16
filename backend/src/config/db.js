import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance across the app — avoids exhausting the
// Postgres connection pool, which is easy to do by accident in Express
// if every route file created its own PrismaClient.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
