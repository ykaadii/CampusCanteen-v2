import { prisma } from "../config/db.js";
import { campusSchema } from "../validations/campus.validation.js";

export async function getCampuses(req, res, next) {
  try {
    const campuses = await prisma.campus.findMany({
      include: {
        _count: {
          select: { canteens: true, users: true },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json({ campuses });
  } catch (err) {
    next(err);
  }
}

export async function createCampus(req, res, next) {
  try {
    const parsed = campusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const campus = await prisma.campus.create({
      data: parsed.data,
    });
    res.status(201).json({ campus });
  } catch (err) {
    next(err);
  }
}

export async function updateCampus(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = campusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const campus = await prisma.campus.update({
      where: { id },
      data: parsed.data,
    });
    res.json({ campus });
  } catch (err) {
    next(err);
  }
}

export async function deleteCampus(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.campus.delete({ where: { id } });
    res.json({ message: "Campus deleted successfully" });
  } catch (err) {
    next(err);
  }
}
