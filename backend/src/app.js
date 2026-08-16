import express from "express";
import { helmetMiddleware, corsMiddleware, apiLimiter } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import campusRoutes from "./routes/campus.routes.js";
import canteenRoutes from "./routes/canteen.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";

export const app = express();

// Security middleware first, before anything touches the request.
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(apiLimiter);
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/campuses", campusRoutes);
app.use("/api/canteens", canteenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

