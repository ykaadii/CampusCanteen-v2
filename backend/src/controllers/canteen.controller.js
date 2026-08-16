import { prisma } from "../config/db.js";
import { canteenSchema, assignStaffSchema } from "../validations/canteen.validation.js";
import { uploadBufferToCloudinary } from "../config/cloudinary.js";

export async function getCanteens(req, res, next) {
  try {
    const { campusId } = req.query;
    const where = campusId ? { campusId } : {};

    // Strict Scoping: If user is CANTEEN_STAFF or CANTEEN_OWNER, return ONLY canteens assigned to them
    if (req.user?.role === "CANTEEN_STAFF") {
      where.staff = { some: { userId: req.user.id } };
    } else if (req.user?.role === "CANTEEN_OWNER") {
      where.owners = { some: { userId: req.user.id } };
    }

    const canteens = await prisma.canteen.findMany({
      where,
      include: {
        campus: { select: { id: true, name: true, city: true } },
        menuItems: {
          orderBy: { createdAt: "desc" },
        },
        staff: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        owners: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { menuItems: true, orders: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json({ canteens });
  } catch (err) {
    next(err);
  }
}

export async function getCanteenById(req, res, next) {
  try {
    const { id } = req.params;
    const canteen = await prisma.canteen.findUnique({
      where: { id },
      include: {
        campus: { select: { id: true, name: true, city: true } },
        menuItems: {
          orderBy: { createdAt: "desc" },
        },
        staff: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        owners: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!canteen) {
      return res.status(404).json({ error: "Canteen not found" });
    }

    // Verify staff/owner assignment
    if (req.user?.role === "CANTEEN_STAFF") {
      const isAssigned = canteen.staff.some((s) => s.userId === req.user.id);
      if (!isAssigned) {
        return res.status(403).json({ error: "You are not authorized to view or manage this canteen" });
      }
    } else if (req.user?.role === "CANTEEN_OWNER") {
      const isOwner = canteen.owners.some((o) => o.userId === req.user.id);
      if (!isOwner) {
        return res.status(403).json({ error: "You are not authorized to view or manage this canteen" });
      }
    }

    res.json({ canteen });
  } catch (err) {
    next(err);
  }
}

export async function createCanteen(req, res, next) {
  try {
    const parsed = canteenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      try {
        const uploadRes = await uploadBufferToCloudinary(req.file.buffer, "canteen_covers");
        imageUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.warn("Cloudinary canteen image upload failed:", uploadErr.message);
      }
    }

    const canteen = await prisma.canteen.create({
      data: {
        ...parsed.data,
        imageUrl,
      },
      include: { campus: true, menuItems: true },
    });
    res.status(201).json({ canteen });
  } catch (err) {
    next(err);
  }
}

export async function updateCanteen(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.canteen.findUnique({
      where: { id },
      include: { staff: true, owners: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Canteen not found" });
    }

    // Verify authorization
    if (req.user?.role === "CANTEEN_STAFF") {
      const isAssigned = existing.staff.some((s) => s.userId === req.user.id);
      if (!isAssigned) {
        return res.status(403).json({ error: "You are not authorized to update this canteen" });
      }
    } else if (req.user?.role === "CANTEEN_OWNER") {
      const isOwner = existing.owners.some((o) => o.userId === req.user.id);
      if (!isOwner) {
        return res.status(403).json({ error: "You are not authorized to update this canteen" });
      }
    }

    let imageUrl = existing.imageUrl;
    if (req.file) {
      try {
        const uploadRes = await uploadBufferToCloudinary(req.file.buffer, "canteen_covers");
        imageUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.warn("Cloudinary canteen image upload failed:", uploadErr.message);
      }
    } else if (req.body.imageUrl !== undefined) {
      imageUrl = req.body.imageUrl;
    }

    const name = req.body.name || existing.name;
    const campusId = req.body.campusId || existing.campusId;
    const isOpen = req.body.isOpen !== undefined ? (req.body.isOpen === "true" || req.body.isOpen === true) : existing.isOpen;

    const canteen = await prisma.canteen.update({
      where: { id },
      data: {
        name,
        campusId,
        isOpen,
        imageUrl,
      },
      include: { campus: true, menuItems: true },
    });
    res.json({ canteen });
  } catch (err) {
    next(err);
  }
}

export async function deleteCanteen(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.canteen.delete({ where: { id } });
    res.json({ message: "Canteen deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function assignStaff(req, res, next) {
  try {
    const { id: canteenId } = req.params;
    const parsed = assignStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { userId } = parsed.data;

    // Upgrade user role to CANTEEN_STAFF if not already admin/owner
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role !== "ADMIN" && user.role !== "CANTEEN_OWNER") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "CANTEEN_STAFF" },
      });
    }

    const staffAssignment = await prisma.canteenStaff.upsert({
      where: {
        userId_canteenId: { userId, canteenId },
      },
      create: { userId, canteenId },
      update: {},
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ staffAssignment });
  } catch (err) {
    next(err);
  }
}

export async function removeStaff(req, res, next) {
  try {
    const { id: canteenId, userId } = req.params;

    await prisma.canteenStaff.deleteMany({
      where: { canteenId, userId },
    });

    res.json({ message: "Staff removed successfully" });
  } catch (err) {
    next(err);
  }
}

// Assign Canteen Owner (Admin operation)
export async function assignOwner(req, res, next) {
  try {
    const { id: canteenId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Upgrade user role to CANTEEN_OWNER if not ADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "CANTEEN_OWNER" },
      });
    }

    const ownerAssignment = await prisma.canteenOwner.upsert({
      where: {
        userId_canteenId: { userId, canteenId },
      },
      create: { userId, canteenId },
      update: {},
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ ownerAssignment });
  } catch (err) {
    next(err);
  }
}

// Remove Canteen Owner (Admin operation)
export async function removeOwner(req, res, next) {
  try {
    const { id: canteenId, userId } = req.params;

    await prisma.canteenOwner.deleteMany({
      where: { canteenId, userId },
    });

    res.json({ message: "Owner removed successfully" });
  } catch (err) {
    next(err);
  }
}

// Canteen Owner Sales Analytics & Reports API
export async function getCanteenAnalytics(req, res, next) {
  try {
    const { id: canteenId } = req.params;

    // Check authorization for CANTEEN_OWNER or ADMIN
    if (req.user.role === "CANTEEN_OWNER") {
      const isOwner = await prisma.canteenOwner.findUnique({
        where: { userId_canteenId: { userId: req.user.id, canteenId } },
      });
      if (!isOwner) {
        return res.status(403).json({ error: "You are not authorized to view analytics for this canteen" });
      }
    }

    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
      include: { campus: { select: { name: true, city: true } } },
    });

    if (!canteen) {
      return res.status(404).json({ error: "Canteen not found" });
    }

    // Fetch all orders for this canteen
    const orders = await prisma.order.findMany({
      where: { canteenId },
      include: {
        user: { select: { name: true, email: true } },
        payment: true,
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 1. Calculate Metrics
    const totalOrdersCount = orders.length;

    // Revenue calculation (count DELIVERED or READY or paid orders)
    const validOrders = orders.filter((o) => o.status !== "CANCELLED");
    const totalRevenue = validOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // Status Breakdown
    const statusCounts = {
      PENDING: orders.filter((o) => o.status === "PENDING").length,
      ACCEPTED: orders.filter((o) => o.status === "ACCEPTED").length,
      PREPARING: orders.filter((o) => o.status === "PREPARING").length,
      READY: orders.filter((o) => o.status === "READY").length,
      DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
      CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    };

    // Payment Method Breakdown
    const paymentBreakdown = {
      CASH: validOrders.filter((o) => o.payment?.method === "CASH").length,
      RAZORPAY: validOrders.filter((o) => o.payment?.method === "RAZORPAY").length,
      CASH_REVENUE: validOrders.filter((o) => o.payment?.method === "CASH").reduce((a, o) => a + Number(o.totalAmount), 0),
      RAZORPAY_REVENUE: validOrders.filter((o) => o.payment?.method === "RAZORPAY").reduce((a, o) => a + Number(o.totalAmount), 0),
    };

    // Order Type Breakdown
    const orderTypeBreakdown = {
      DINE_IN: validOrders.filter((o) => o.orderType === "DINE_IN").length,
      TAKEAWAY: validOrders.filter((o) => o.orderType === "TAKEAWAY").length,
    };

    // Top Selling Dishes Analysis
    const itemSalesMap = {};
    validOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const dishId = item.menuItemId;
        const dishName = item.menuItem?.name || "Dish";
        const dishImage = item.menuItem?.imageUrl || null;
        const qty = item.quantity;
        const rev = Number(item.price) * qty;

        if (!itemSalesMap[dishId]) {
          itemSalesMap[dishId] = { id: dishId, name: dishName, imageUrl: dishImage, quantitySold: 0, revenue: 0 };
        }
        itemSalesMap[dishId].quantitySold += qty;
        itemSalesMap[dishId].revenue += rev;
      });
    });

    const topSellingDishes = Object.values(itemSalesMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // 2. Day-Wise Revenue Aggregation
    const dailyMap = {};
    validOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const formattedDate = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
      const rev = Number(order.totalAmount);
      const isCash = order.payment?.method === "CASH";

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          dateStr,
          formattedDate,
          revenue: 0,
          ordersCount: 0,
          cashRevenue: 0,
          onlineRevenue: 0,
        };
      }
      dailyMap[dateStr].revenue += rev;
      dailyMap[dateStr].ordersCount += 1;
      if (isCash) dailyMap[dateStr].cashRevenue += rev;
      else dailyMap[dateStr].onlineRevenue += rev;
    });

    const dailySales = Object.values(dailyMap).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    // 3. Month-Wise Revenue Aggregation
    const monthlyMap = {};
    validOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
      const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const rev = Number(order.totalAmount);

      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = {
          monthStr,
          monthName,
          revenue: 0,
          ordersCount: 0,
        };
      }
      monthlyMap[monthStr].revenue += rev;
      monthlyMap[monthStr].ordersCount += 1;
    });

    const monthlySales = Object.values(monthlyMap).sort((a, b) => b.monthStr.localeCompare(a.monthStr));

    // 4. Today's Hourly Peak Sales Aggregation
    const todayStr = new Date().toISOString().split("T")[0];
    const todayOrders = validOrders.filter((o) => new Date(o.createdAt).toISOString().split("T")[0] === todayStr);

    const hourlyMap = {};
    for (let h = 0; h < 24; h++) {
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const hourLabel = `${displayHour}:00 ${ampm}`;
      hourlyMap[h] = { hour: h, hourLabel, revenue: 0, ordersCount: 0 };
    }

    todayOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      if (hourlyMap[hour]) {
        hourlyMap[hour].revenue += Number(order.totalAmount);
        hourlyMap[hour].ordersCount += 1;
      }
    });

    const hourlySales = Object.values(hourlyMap).filter((h) => h.ordersCount > 0 || h.revenue > 0);

    res.json({
      canteen,
      metrics: {
        totalOrdersCount,
        validOrdersCount: validOrders.length,
        totalRevenue,
        averageOrderValue,
        statusCounts,
        paymentBreakdown,
        orderTypeBreakdown,
      },
      topSellingDishes,
      dailySales,
      monthlySales,
      hourlySales,
      recentOrders: orders.slice(0, 25),
    });
  } catch (err) {
    next(err);
  }
}
