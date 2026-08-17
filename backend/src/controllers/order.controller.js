import { prisma } from "../config/db.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validations/order.validation.js";
import { getIO } from "../config/socket.js";
import { sendPushNotification } from "../config/firebase.js";
import { sendOrderConfirmationEmail, sendOrderReadyEmail } from "../config/nodemailer.js";

// Helper function to verify canteen staff authorization
async function verifyStaffAuthorization(userId, canteenId, userRole) {
  if (userRole === "ADMIN") return true;
  const assignment = await prisma.canteenStaff.findUnique({
    where: {
      userId_canteenId: { userId, canteenId },
    },
  });
  return Boolean(assignment);
}

export async function createOrder(req, res, next) {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { canteenId, paymentMethod, orderType, pickupDelayMinutes, items } = parsed.data;
    const userId = req.user.id;

    // Calculate pickup target time (0 to 60 mins delay)
    const delayMins = Math.min(Math.max(pickupDelayMinutes || 0, 0), 60);
    const pickupTime = new Date(Date.now() + delayMins * 60 * 1000);

    // Verify canteen exists and is open
    const canteen = await prisma.canteen.findUnique({ where: { id: canteenId } });
    if (!canteen) {
      return res.status(404).json({ error: "Canteen not found" });
    }
    if (!canteen.isOpen) {
      return res.status(400).json({ error: "Canteen is currently closed" });
    }

    // Fetch menu items from DB to get authoritative prices and availability
    const menuItemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, canteenId },
    });

    if (dbMenuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: "One or more menu items are invalid or not from this canteen" });
    }

    // Check availability & calculate subtotal
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = dbMenuItems.find((m) => m.id === item.menuItemId);
      if (!dbItem.isAvailable) {
        return res.status(400).json({ error: `Item "${dbItem.name}" is currently unavailable` });
      }
      const itemPrice = Number(dbItem.price);
      totalAmount += itemPrice * item.quantity;
      orderItemsData.push({
        menuItemId: dbItem.id,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    // Date object for tokenDate (normalized to midnight UTC / local date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Atomic Prisma transaction to calculate token and create order
    const result = await prisma.$transaction(async (tx) => {
      const highestTokenOrder = await tx.order.findFirst({
        where: {
          canteenId,
          tokenDate: today,
        },
        orderBy: { token: "desc" },
        select: { token: true },
      });

      const nextToken = (highestTokenOrder?.token || 0) + 1;

      const newOrder = await tx.order.create({
        data: {
          userId,
          canteenId,
          token: nextToken,
          tokenDate: today,
          status: "PENDING",
          orderType: orderType || "DINE_IN",
          pickupTime,
          totalAmount,
          items: {
            create: orderItemsData,
          },
          payment: {
            create: {
              status: "PENDING",
              method: paymentMethod,
              amount: totalAmount,
            },
          },
        },
        include: {
          canteen: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
          items: { include: { menuItem: true } },
          payment: true,
        },
      });

      return newOrder;
    });

    // Send transactional order confirmation email
    if (result.user?.email) {
      sendOrderConfirmationEmail({
        to: result.user.email,
        name: result.user.name,
        order: result,
      }).catch((emailErr) => console.warn("Order email notice:", emailErr.message));
    }

    // Notify canteen staff via Socket.IO room canteen:<canteenId>
    try {
      const io = getIO();
      io.to(`canteen:${canteenId}`).emit("order:created", result);
      io.to(`user:${userId}`).emit("order:created", result);
    } catch (socketErr) {
      console.warn("Socket.IO notification skipped:", socketErr.message);
    }

    res.status(201).json({ order: result });
  } catch (err) {
    next(err);
  }
}

export async function getStudentOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        canteen: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getCanteenOrders(req, res, next) {
  try {
    const { canteenId } = req.params;
    const { status } = req.query;

    // Strict Authorization Check: Canteen Staff can ONLY view their assigned canteen queue
    const isAuthorized = await verifyStaffAuthorization(req.user.id, canteenId, req.user.role);
    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to view order queue for this canteen" });
    }

    const where = { canteenId };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { menuItem: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = updateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { status } = parsed.data;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { id: true, fcmToken: true } } },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Strict Authorization Check: Canteen Staff can ONLY update their assigned canteen orders
    const isAuthorized = await verifyStaffAuthorization(req.user.id, existingOrder.canteenId, req.user.role);
    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to update orders for this canteen" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        canteen: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        items: { include: { menuItem: true } },
        payment: true,
      },
    });

    // Real-time Socket.IO notification
    try {
      const io = getIO();
      io.to(`user:${updatedOrder.userId}`).emit("order:updated", updatedOrder);
      io.to(`canteen:${updatedOrder.canteenId}`).emit("order:updated", updatedOrder);
    } catch (socketErr) {
      console.warn("Socket.IO emit error:", socketErr.message);
    }

    // Trigger Order Ready Email ONLY if status is READY
    if (status === "READY" && updatedOrder.user?.email) {
      sendOrderReadyEmail({
        to: updatedOrder.user.email,
        name: updatedOrder.user.name,
        order: updatedOrder,
      }).catch((emailErr) => console.warn("Order ready email notice:", emailErr.message));
    }

    // Push notification via Firebase Cloud Messaging
    if (existingOrder.user?.fcmToken) {
      sendPushNotification(existingOrder.user.fcmToken, {
        title: `Order Token #${updatedOrder.token} ${status.toLowerCase()}`,
        body: `Your order from ${updatedOrder.canteen.name} is now ${status.toLowerCase()}.`,
      }).catch((fcmErr) => console.warn("FCM Push error:", fcmErr.message));
    }

    res.json({ order: updatedOrder });
  } catch (err) {
    next(err);
  }
}
