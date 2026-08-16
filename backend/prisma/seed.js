import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CampusCanteen database...");

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@campus.edu" },
    update: { role: "ADMIN" },
    create: {
      name: "Campus Admin",
      email: "admin@campus.edu",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Created Admin:", admin.email);

  // Create default student user
  const studentPassword = await bcrypt.hash("student1234", 10);
  const student = await prisma.user.upsert({
    where: { email: "alex@student.edu" },
    update: {},
    create: {
      name: "Alex Smith",
      email: "alex@student.edu",
      passwordHash: studentPassword,
      role: "STUDENT",
    },
  });
  console.log("Created Student:", student.email);

  // Create default campus
  let campus = await prisma.campus.findFirst({ where: { name: "Main University Campus" } });
  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        name: "Main University Campus",
        city: "Tech City",
      },
    });
  }
  console.log("Created Campus:", campus.name);

  // Create default canteen
  let canteen = await prisma.canteen.findFirst({ where: { name: "Central Student Food Court" } });
  if (!canteen) {
    canteen = await prisma.canteen.create({
      data: {
        name: "Central Student Food Court",
        campusId: campus.id,
        isOpen: true,
      },
    });
  }
  console.log("Created Canteen:", canteen.name);

  // Create canteen staff user
  const staffPassword = await bcrypt.hash("staff1234", 10);
  const staff = await prisma.user.upsert({
    where: { email: "staff@canteen.edu" },
    update: { role: "CANTEEN_STAFF" },
    create: {
      name: "Canteen Manager Sam",
      email: "staff@canteen.edu",
      passwordHash: staffPassword,
      role: "CANTEEN_STAFF",
    },
  });

  await prisma.canteenStaff.upsert({
    where: { userId_canteenId: { userId: staff.id, canteenId: canteen.id } },
    create: { userId: staff.id, canteenId: canteen.id },
    update: {},
  });
  console.log("Assigned Staff:", staff.email);

  // Seed Menu Items
  const menuItems = [
    {
      name: "Paneer Butter Masala Combo",
      description: "Creamy paneer butter masala served with 2 butter naans and jeera rice.",
      price: 180.0,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop",
    },
    {
      name: "Veg Cheese Burger & Fries",
      description: "Crispy vegetable patty with melted cheese, lettuce, tomato and seasoned fries.",
      price: 120.0,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop",
    },
    {
      name: "Cold Coffee with Ice Cream",
      description: "Rich chilled espresso blended with milk and topped with vanilla ice cream.",
      price: 80.0,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop",
    },
    {
      name: "Masala Dosa with Sambar",
      description: "Crispy rice crepes stuffed with spiced potato filling, served with coconut chutney.",
      price: 90.0,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop",
    },
    {
      name: "Grilled Chicken Wrap",
      description: "Tender grilled chicken strips with spicy mayo and fresh greens in a soft tortilla.",
      price: 150.0,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop",
    },
  ];

  for (const item of menuItems) {
    const existingItem = await prisma.menuItem.findFirst({
      where: { canteenId: canteen.id, name: item.name },
    });
    if (!existingItem) {
      await prisma.menuItem.create({
        data: {
          ...item,
          canteenId: canteen.id,
        },
      });
    }
  }
  console.log("Seeded sample menu items.");

  console.log("\nDatabase seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
