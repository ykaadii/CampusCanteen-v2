import { prisma } from "../config/db.js";
import { menuItemSchema } from "../validations/menu.validation.js";
import { uploadBufferToCloudinary } from "../config/cloudinary.js";

async function verifyStaffAuthorization(userId, canteenId, userRole) {
  if (userRole === "ADMIN") return true;

  if (userRole === "CANTEEN_OWNER") {
    const owner = await prisma.canteenOwner.findUnique({
      where: { userId_canteenId: { userId, canteenId } },
    });
    if (owner) return true;
  }

  const assignment = await prisma.canteenStaff.findUnique({
    where: {
      userId_canteenId: { userId, canteenId },
    },
  });
  return Boolean(assignment);
}

export async function getMenuItems(req, res, next) {
  try {
    const { canteenId } = req.params;
    const items = await prisma.menuItem.findMany({
      where: { canteenId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function createMenuItem(req, res, next) {
  try {
    const canteenId = req.params.canteenId || req.body.canteenId;
    const bodyToValidate = {
      ...req.body,
      canteenId,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
    };

    const parsed = menuItemSchema.safeParse(bodyToValidate);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    // Verify staff/owner authorization
    const isAuthorized = await verifyStaffAuthorization(req.user.id, parsed.data.canteenId, req.user.role);
    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to create menu items for this canteen" });
    }

    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      try {
        const uploadRes = await uploadBufferToCloudinary(req.file.buffer, "canteen_menu");
        imageUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.warn("Cloudinary upload failed, continuing without image:", uploadErr.message);
      }
    }

    const item = await prisma.menuItem.create({
      data: {
        ...parsed.data,
        imageUrl,
      },
    });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Verify staff/owner authorization
    const isAuthorized = await verifyStaffAuthorization(req.user.id, existing.canteenId, req.user.role);
    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to update menu items for this canteen" });
    }

    const bodyToValidate = {
      ...req.body,
      canteenId: existing.canteenId,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
    };

    const parsed = menuItemSchema.safeParse(bodyToValidate);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    let imageUrl = existing.imageUrl;
    if (req.file) {
      try {
        const uploadRes = await uploadBufferToCloudinary(req.file.buffer, "canteen_menu");
        imageUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.warn("Cloudinary upload failed, keeping existing image:", uploadErr.message);
      }
    } else if (req.body.imageUrl !== undefined) {
      imageUrl = req.body.imageUrl || null;
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...parsed.data,
        imageUrl,
      },
    });

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function toggleAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Verify staff/owner authorization
    const isAuthorized = await verifyStaffAuthorization(req.user.id, existing.canteenId, req.user.role);
    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to update menu items for this canteen" });
    }

    const nextAvailability =
      req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : !existing.isAvailable;

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: nextAvailability },
    });

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function deleteMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Verify staff/owner authorization
    const isAuthorized = await verifyStaffAuthorization(req.user.id, existing.canteenId, req.user.role);
    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to delete menu items for this canteen" });
    }

    // If item has historical customer orders, mark as unavailable (Sold Out) to preserve order receipts
    if (existing._count?.orderItems > 0) {
      await prisma.menuItem.update({
        where: { id },
        data: { isAvailable: false },
      });
      return res.json({
        message: "Item is linked to past customer orders. It has been marked as Unavailable (Sold Out) instead of deleted.",
        softDeleted: true,
      });
    }

    // Safe to hard delete if never ordered
    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: "Menu item deleted successfully" });
  } catch (err) {
    if (err.code === "P2003") {
      // Foreign Key Violation Safety Fallback
      await prisma.menuItem.update({
        where: { id: req.params.id },
        data: { isAvailable: false },
      }).catch(() => {});
      return res.json({
        message: "Item is linked to past customer orders. Marked as Unavailable instead of deleted.",
        softDeleted: true,
      });
    }
    next(err);
  }
}
