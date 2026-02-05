import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { carMakers } from "./drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

const lebanonCarMakes = [
  "Kia",
  "Hyundai",
  "BMW",
  "Mercedes-Benz",
  "Toyota",
  "Nissan",
  "Honda",
  "Mazda",
  "Volkswagen",
  "Audi",
  "Chevrolet",
  "Ford",
  "Peugeot",
  "Renault",
  "Citroen",
  "Mitsubishi",
  "Suzuki",
  "Subaru",
  "Lexus",
  "Infiniti",
  "Jeep",
  "Land Rover",
  "Porsche",
  "Volvo",
  "Fiat",
  "Alfa Romeo",
  "Seat",
  "Skoda",
  "Mini",
  "Jaguar"
];

async function seedLebanonCars() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  
  console.log("Seeding Lebanon car makes...");
  
  for (const make of lebanonCarMakes) {
    try {
      await db.insert(carMakers).values({
        name: make,
        country: "Lebanon",
        isCustom: false,
        userId: null
      });
      console.log(`✓ Added ${make}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`- ${make} already exists`);
      } else {
        console.error(`✗ Error adding ${make}:`, error.message);
      }
    }
  }
  
  await connection.end();
  console.log("\nSeeding complete!");
}

seedLebanonCars().catch(console.error);
