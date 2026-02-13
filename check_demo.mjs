import { drizzle } from "drizzle-orm/mysql2";
import { users, vehicles } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const demoUser = await db.select().from(users).where(eq(users.username, 'demo@system')).limit(1);
console.log("Demo user:", demoUser.length > 0 ? `ID ${demoUser[0].id}` : "Not found");

if (demoUser.length > 0) {
  const vehicleCount = await db.select().from(vehicles).where(eq(vehicles.userId, demoUser[0].id));
  console.log("Vehicles for demo user:", vehicleCount.length);
}
