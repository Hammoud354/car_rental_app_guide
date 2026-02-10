import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { nationalities } from "../drizzle/schema.js";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function removeDuplicateNationalities() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("Removing duplicate nationalities...");

  try {
    // Delete duplicates, keeping only the first occurrence of each nationality
    const result = await db.execute(sql`
      DELETE n1 FROM nationalities n1
      INNER JOIN nationalities n2
      WHERE n1.id > n2.id AND n1.nationality = n2.nationality
    `);

    console.log(`✅ Removed ${result[0].affectedRows} duplicate nationalities`);

    // Show remaining unique nationalities count
    const remaining = await db.execute(sql`SELECT COUNT(DISTINCT nationality) as count FROM nationalities`);
    console.log(`✅ Remaining unique nationalities: ${remaining[0][0].count}`);

  } catch (error) {
    console.error("❌ Error removing duplicates:", error);
  } finally {
    await connection.end();
  }
}

removeDuplicateNationalities();
