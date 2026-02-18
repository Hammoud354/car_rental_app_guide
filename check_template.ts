import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection, { schema, mode: 'default' });

const profiles = await db.select().from(schema.companyProfiles).where(eq(schema.companyProfiles.userId, 1470001));
console.log('Profile for user 1470001:', JSON.stringify(profiles, null, 2));

await connection.end();
