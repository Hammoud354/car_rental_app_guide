import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from './drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Hash password
const hashedPassword = await bcrypt.hash('walid', 10);

// Create super admin user
try {
  const result = await db.insert(users).values({
    username: 'walid',
    password: hashedPassword,
    name: 'Walid',
    email: 'walid@admin.com',
    phone: '+96176354131',
    country: 'Lebanon',
    role: 'admin',
  });

  console.log('✅ Super admin user created successfully!');
  console.log('Username: walid (case-insensitive)');
  console.log('Password: walid');
  console.log('Role: admin');
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    console.log('⚠️  User "walid" already exists');
  } else {
    console.error('Error creating user:', error.message);
  }
}

await connection.end();
