import { prisma } from "../config/db.js";
import { updateUserRoleSchema } from "../validations/admin.validation.js";

export async function getUsers(req, res, next) {
  try {
    const { role, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
        campus: { select: { id: true, name: true } },
        staffCanteens: {
          include: { canteen: { select: { id: true, name: true } } },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = updateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { role, campusId, canteenId } = parsed.data;

    const user = await prisma.user.update({
      where: { id },
      data: {
        role,
        campusId: campusId || null,
      },
      select: { id: true, name: true, email: true, role: true, campusId: true },
    });

    if (role === "CANTEEN_STAFF" && canteenId) {
      await prisma.canteenStaff.upsert({
        where: { userId_canteenId: { userId: id, canteenId } },
        create: { userId: id, canteenId },
        update: {},
      });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateFcmToken(req, res, next) {
  try {
    const { fcmToken } = req.body;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken },
    });
    res.json({ message: "FCM token updated successfully" });
  } catch (err) {
    next(err);
  }
}
